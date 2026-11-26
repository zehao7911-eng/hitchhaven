from pathlib import Path
import subprocess, os, base64
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parent
fallback=root.parent.parent/'work/hitchhaven-deps/esbuild/package/esbuild.exe'
exe=os.environ.get('ESBUILD',str(fallback))
subprocess.run([exe,str(root/'app.mjs'),'--bundle','--format=iife','--target=es2022','--minify','--legal-comments=inline','--outfile='+str(root/'game.js')],check=True)
html=(root/'index-source.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('href="icon.svg"','href="data:image/svg+xml;base64,'+base64.b64encode((root/'icon.svg').read_bytes()).decode()+'"')
script=(root/'game.js').read_text(encoding='utf-8').replace('</script','<\\/script')
html=html.replace('<script type="module" src="app.mjs"></script>','<script>'+script+'</script>')
for name in ['index.html','standalone.html']:(root/name).write_text(html,encoding='utf-8',newline='\n')
files=sorted(p for p in root.rglob('*') if p.is_file())
archive=root.parent/'HITCHHAVEN.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for f in files:z.write(f,f.relative_to(root).as_posix())
with ZipFile(archive) as z:
 assert z.testzip() is None
 assert z.read('index.html')==z.read('standalone.html')
 assert all(z.read(f.relative_to(root).as_posix())==f.read_bytes() for f in files)
print(f'Built {archive.name}: {archive.stat().st_size:,} bytes; {len(files)} files; root index / standalone identical.')
