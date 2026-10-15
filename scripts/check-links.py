from html.parser import HTMLParser
from pathlib import Path
Path("qa").mkdir(exist_ok=True)
import urllib.request, urllib.error, json
from concurrent.futures import ThreadPoolExecutor
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=set()
 def handle_starttag(self,t,a):
  u=dict(a).get('href','')
  if t=='a' and u.startswith('https:'):self.urls.add(u)
s=Links();s.feed(open('index.html').read())
def check(url):
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as r:return {'url':url,'status':r.status,'final':r.url}
 except Exception as e:return {'url':url,'error':str(e)}
results=list(ThreadPoolExecutor(6).map(check,sorted(s.urls)));open('qa/link-results.json','w').write(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
