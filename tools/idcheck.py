import re,sys
h=open(sys.argv[1]).read(); js=h[h.index('>',h.rindex('<script'))+1:h.rindex('</script>')]; markup=h[:h.rindex('<script')]
ids=set(re.findall(r'\bid="([^"]+)"',markup))|set(re.findall(r'\bid=([A-Za-z][\w-]*)[ >]',markup))
made=set(re.findall(r'id="([\w-]+)"',js))|set(re.findall(r'\.id\s*=\s*["\']([\w-]+)',js))
refs=set(re.findall(r'(?:\$|getElementById)\(\s*["\']([\w-]+)["\']\s*\)',js))|set(re.findall(r'querySelector(?:All)?\(\s*["\']#([\w-]+)',js))
print("referenced but missing:",sorted(refs-ids-made))
print("in markup but never referenced in JS/CSS:",sorted(i for i in ids if i not in js and '#'+i not in h[:h.index('</style>')]))
