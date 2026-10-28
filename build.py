import os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda p:open(os.path.join(d,'src',p),encoding='utf-8').read()
three=r('three.min.js');assert '</script' not in three.lower()
html=r('head.html')+'<script>/* three.js r160 (MIT) https://threejs.org */\n'+three+'\n</script>\n<script>\n'+r('game.js')+'\n</script>\n</body></html>\n'
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(html)
print('index.html',len(html)//1024,'kB')
