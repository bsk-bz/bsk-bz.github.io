"""Dependency-free static validation. Run from the repository root."""
from html.parser import HTMLParser
from pathlib import Path
import json
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET
class Site(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]; self.headings=[]; self.schemas=[]; self.schema=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ['a','link','img','script']:
            for key in ['href','src']:
                if a.get(key):self.links.append(a[key])
        if tag=='img':assert 'alt' in a and 'width' in a and 'height' in a
        if tag=='h1':self.headings.append(tag)
        if tag=='script' and a.get('type')=='application/ld+json':self.schema=True
    def handle_data(self,data):
        if self.schema and data.strip():self.schemas.append(json.loads(data))
    def handle_endtag(self,tag):
        if tag=='script':self.schema=False
s=Site();s.feed(Path('index.html').read_text())
assert len(s.ids)==len(set(s.ids)), 'Duplicate IDs'
assert len(s.headings)==1
for link in s.links:
    url=urlsplit(link)
    if url.scheme or url.netloc:continue
    if url.fragment:assert url.fragment in s.ids,link
    if url.path:assert Path(unquote(url.path).lstrip('/')).exists(),link
assert s.schemas[0]['@type']=='Person'
assert Path('CNAME').read_text().strip()=='bsk.bz'
ET.parse('sitemap.xml')
print(f'PASS: {len(s.links)} references, {len(s.ids)} unique IDs, image attributes, Person schema, sitemap and CNAME')
