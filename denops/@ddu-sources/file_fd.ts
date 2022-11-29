import { BaseSource, Item, SourceOptions } from "https://deno.land/x/ddu_vim@v1.8.7/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v1.8.7/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.3.0/file.ts";
import { relative } from "https://deno.land/std@0.147.0/path/mod.ts";
import { BufReader } from "https://deno.land/std@0.147.0/io/buffer.ts";
import { abortable } from "https://deno.land/std@0.147.0/async/mod.ts";

type Params = {
  "new": boolean;
  "args": string[];
};

async function* iterLine(reader: Deno.Reader): AsyncIterable<string> {
  const buffered = new BufReader(reader);
  while (true) {
    const line = await buffered.readString("\n");
    if (!line) {
      break;
    }
    yield line;
  }
}

const abortController = new AbortController();
const maxItems = 20000;

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    input: string;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller: ReadableStreamDefaultController<Item<ActionData>[]>) {

        let dir = args.sourceOptions.path;
        if (dir == "") {
          dir = await fn.getcwd(args.denops) as string;
        }

        const tree = async (root: string) => {
          let items: Item<ActionData>[] = [];

          const cmd = ["fd", ".", `${root}`, ...args.sourceParams.args]; 
          const proc = Deno.run({
            cmd: cmd, 
            stdout: "piped",
          });

          try {
            for await(const line of abortable(iterLine(proc.stdout), abortController.signal)) {
              const fullPath = line.trim();
              if (fullPath == "") {
                continue;
              }

              const relativePath = relative(root, fullPath);
              const stat = await Deno.stat(fullPath);

              items.push({
                word: `${relativePath}${stat.isDirectory ? "/" : ""}`,
                action: {
                  path: fullPath,
                  isDirectory: stat.isDirectory,
                },
              });

              if (items.length > maxItems) {
                controller.enqueue(items);
                items = [];
              }
            }
          } catch (e: unknown) {
            console.error(e);
          } finally {
            proc.close();
          }

          return items;
        };

          controller.enqueue(
            await tree(dir),
          );

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      "new": false,
      "args": ["--max-depth", "1", "--hidden"],
    };
  }
}
