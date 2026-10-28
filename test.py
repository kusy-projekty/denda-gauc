import sys,os,json
from playwright.sync_api import sync_playwright
D='/workspace/denda-gauc';OUT=D+'/screens';os.makedirs(OUT,exist_ok=True)
W,H=(int(sys.argv[1]),int(sys.argv[2])) if len(sys.argv)>2 else (1280,720)
mob=W<H;pre='m-' if mob else ''
ERR=[]
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    c=br.new_context(viewport={'width':W,'height':H},has_touch=mob,is_mobile=mob)
    pg=c.new_page()
    pg.on('console',lambda m:m.type in('error','warning') and ERR.append(m.type+': '+m.text))
    pg.on('pageerror',lambda e:ERR.append('PAGEERR '+str(e)))
    pg.goto('file://'+D+'/index.html');pg.wait_for_timeout(1500)
    sh=lambda n:pg.screenshot(path=f'{OUT}/{pre}{n}.png')
    sh('00-titulka')
    pg.click('#play',force=True);pg.wait_for_function("G.scene==='rano'");pg.wait_for_timeout(1200);sh('anetka-01-rano')
    pg.wait_for_function("G.cur.ph==='talk'",timeout=15000);pg.wait_for_timeout(800);sh('anetka-02-prichod')
    pg.wait_for_function("G.cur.ph==='duvet'",timeout=15000);pg.wait_for_timeout(1300);sh('anetka-03-perina')
    pg.wait_for_function("G.cur.ph==='black'",timeout=15000);pg.wait_for_timeout(900);sh('anetka-04-chvilicka')
    pg.wait_for_function("G.cur.ph==='kiss'",timeout=15000);pg.wait_for_timeout(900);sh('anetka-05-pa-zlato')
    pg.wait_for_function("G.scene==='gauc'",timeout=20000);pg.wait_for_timeout(1500);sh('01-gauc-start')
    print('po rane',pg.evaluate("JSON.stringify(G.ST)"))
    # sníst 5 burgerů
    def eat(n,first=None):
        for i in range(n):
            pg.wait_for_function("G.cur.cour&&G.cur.cour.st==='wait'",timeout=25000)
            if i==0 and first: sh(first)
            pg.click('#bEat',force=True);pg.wait_for_timeout(900)
    eat(2,'02-kuryr-prisel')
    # --- Kusáč: zvonek, plazení, basáky, diskotéka ---
    pg.wait_for_function("G.cur.state==='bell'",timeout=15000);pg.wait_for_timeout(500);sh('kusac-01-zvonek')
    for i in range(5):
        if mob: pg.tap('#bCrawl',force=True)
        else: pg.keyboard.press('Space')
        pg.wait_for_timeout(350)
    pg.wait_for_timeout(600);sh('kusac-02-plazeni')
    for i in range(4):
        if mob: pg.tap('#bCrawl',force=True)
        else: pg.keyboard.press('Space')
        pg.wait_for_timeout(350)
    pg.wait_for_function("G.cur.state==='visit'",timeout=8000);pg.wait_for_timeout(1500);sh('kusac-03-dvere-basaky')
    pg.wait_for_function("G.cur.ph2==='disco'",timeout=25000);pg.wait_for_timeout(1200);sh('kusac-04-diskoteka')
    if mob: pg.tap('#bBass',force=True)
    else: pg.keyboard.press('KeyB')
    pg.wait_for_timeout(2600);sh('kusac-05-diskoteka-tanec')
    pg.wait_for_function("G.cur.state==='sit'&&G.cur.visited",timeout=30000);pg.wait_for_timeout(800);sh('kusac-06-po-navsteve')
    print('po kusacovi',pg.evaluate("JSON.stringify(G.ST)"))
    # --- parta pod okny: 2x zařvat ---
    for k in range(2):
        pg.wait_for_function("G.cur.party.on&&G.cur.state==='sit'&&!document.querySelector('#bOkno').classList.contains('off')",timeout=40000);pg.wait_for_timeout(2500)
        if k==0: sh('okno-01-parta')
        if mob: pg.tap('#bOkno',force=True)
        else: pg.keyboard.press('KeyO')
        pg.wait_for_timeout(500)
        if k==0: sh('okno-02-zarval')
        pg.wait_for_timeout(2000)
        if k==0: sh('okno-03-ticho')
    print('po okne',pg.evaluate("JSON.stringify(G.ST)"))
    eat(3)
    pg.keyboard.press('KeyT');pg.wait_for_timeout(500)
    sh('03-gauc-tlusty')
    st=pg.evaluate("JSON.stringify(G.ST)");print('po jidle',st)
    pg.click('#bStand',force=True);pg.wait_for_timeout(1900);sh('04-krup')
    pg.wait_for_function("G.scene==='sanitka'",timeout=8000);pg.wait_for_timeout(3600);sh('05-sanitka')
    pg.wait_for_function("G.scene==='spital'",timeout=10000);pg.wait_for_timeout(800);sh('06-spital-zacatek')
    for i in range(7): pg.keyboard.press('Space');pg.wait_for_timeout(120)
    sh('07-spital-sadrovani')
    for i in range(6): pg.keyboard.press('Space');pg.wait_for_timeout(120)
    pg.wait_for_selector('#bCall',timeout=5000);pg.wait_for_timeout(300);sh('08-spital-hotovo')
    pg.keyboard.press('Enter');pg.wait_for_function("G.scene==='golf'");pg.wait_for_timeout(2500);sh('09-golf-jizda')
    # nahodne zatacej
    import random
    for i in range(40):
        pg.keyboard.press(random.choice(['ArrowLeft','ArrowRight']));pg.wait_for_timeout(450)
    sh('10-golf-skrabance')
    pg.wait_for_function("G.cur.fin>0",timeout=60000);pg.wait_for_timeout(2800);sh('11-golf-parkovani')
    print('golf',pg.evaluate("JSON.stringify(G.ST)"))
    pg.keyboard.press('Enter');pg.wait_for_function("G.scene==='fotbal'");pg.wait_for_timeout(1500);sh('12-fotbal-start')
    # bot: jdi za mic a kopej
    goal_shot=False
    for i in range(400):
        r=pg.evaluate("""(()=>{const c=G.cur;if(G.scene!=='fotbal')return null;const P=c.D.g.position,b=c.ball.position;const dx=b.x-P.x,dz=(b.z+0.5)-P.z;const d=Math.hypot(dx,dz);
          G.joy.x=d>0.4?dx/d:0;G.joy.y=d>0.4?dz/d:-1;return [d,ST_=G.ST.goly,c.rest,G.ST.tep]})()""".replace('ST_=',''))
        if r is None: break
        if r[0]<1.2: pg.keyboard.press('Space')
        if r[1]>=1 and not goal_shot: goal_shot=True;pg.wait_for_timeout(200);sh('13-fotbal-gol')
        if i==60: sh('14-fotbal-hra')
        pg.wait_for_timeout(150)
    pg.wait_for_function("G.scene==='konec'",timeout=90000);pg.wait_for_timeout(2500);sh('15-konec-statistiky')
    print('konec',pg.evaluate("JSON.stringify(G.ST)"))
    pg.click('#again',force=True);pg.wait_for_function("G.scene==='rano'");pg.wait_for_timeout(1200);sh('16-znovu')
    print('znovu',pg.evaluate("JSON.stringify(G.ST)"))
    br.close()
print('ERRORS:',json.dumps(ERR,ensure_ascii=False,indent=1))
