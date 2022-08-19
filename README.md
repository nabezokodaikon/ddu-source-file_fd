# ddu-source-file_fd

File source for ddu.vim

This source collects files in the path.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

### ddu-kind-file

https://github.com/Shougo/ddu-kind-file

### fd

https://github.com/sharkdp/fd

## Configuration

```vim
" Change base path.
call ddu#custom#patch_global('sourceOptions', {
      \ 'file_fd': {'path': expand("~")},
      \ })

" For use in the filer UI.
" call ddu#custom#patch_global({'ui': 'filer'})

" Use source.
call ddu#start({'sources': [{'name': 'file_fd'}]})
```
