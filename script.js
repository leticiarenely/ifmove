(function(){
  const missions = [
    { tag:'automático · visão computacional', manual:false, name:'Agachamento', desc:'A câmera reconhece o ângulo do joelho e conta cada repetição em tempo real.', pts:'10 pts / repetição' },
    { tag:'automático · visão computacional', manual:false, name:'Polichinelo', desc:'Braços e pernas são rastreados para validar cada salto completo.', pts:'8 pts / repetição' },
    { tag:'automático · visão computacional', manual:false, name:'Flexão', desc:'O ângulo do cotovelo é medido para confirmar cada flexão completa. Posicione o celular de lado, no chão, para a câmera enxergar o corpo inteiro.', pts:'12 pts / repetição' },
    { tag:'manual · em breve com IA', manual:true, name:'Caminhada pelo campus', desc:'Faça uma volta por um trajeto do campus e registre como se sentiu ao final.', pts:'15 pts' },
    { tag:'manual · em breve com IA', manual:true, name:'Escada em vez de elevador', desc:'Suba pelo menos 2 andares de escada e registre a missão concluída.', pts:'15 pts' },
    { tag:'manual · em breve com IA', manual:true, name:'Convide um colega', desc:'Jogue em dupla — movimento em grupo rende pontos para os dois.', pts:'15 pts' },
  ];

  const grid = document.getElementById('missionsGrid');
  missions.forEach(m=>{
    const card = document.createElement('div');
    card.className = 'm-card';
    card.innerHTML = `
      <div class="m-tag ${m.manual ? 'manual':''}">${m.tag}</div>
      <div class="m-name">${m.name}</div>
      <div class="m-desc">${m.desc}</div>
      <div class="m-points">${m.pts}</div>
      ${m.manual ? '<button class="btn-ghost" data-manual-pts="15">Concluir tarefa</button>' : ''}
    `;
    grid.appendChild(card);
  });
  grid.addEventListener('click', (e)=>{
    if(e.target.matches('[data-manual-pts]')){
      addPoints(15);
      logFeed(`+15 pts — tarefa manual concluída`);
      e.target.disabled = true;
      e.target.textContent = 'Concluída ✓';
    }
  });

  const video = document.getElementById('video');
  const canvas = document.getElementById('overlay');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const camMsg = document.getElementById('camMsg');
  const camMsgText = document.getElementById('camMsgText');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const repCountEl = document.getElementById('repCount');
  const pointCountEl = document.getElementById('pointCount');
  const feedEl = document.getElementById('feed');
  const levelName = document.getElementById('levelName');
  const levelBar = document.getElementById('levelBar');
  const levelHint = document.getElementById('levelHint');

  let mode = 'squat';
  document.querySelectorAll('.mission-pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.mission-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      squatState = 'up'; jjState = 'closed'; pushupState = 'up';
      const modeNames = { squat:'Agachamento', jack:'Polichinelo', pushup:'Flexão' };
      logFeed(`Missão alterada para ${modeNames[mode]}`);
    });
  });

  let detector = null;
  let running = false;
  let reps = 0;
  let points = 0;
  let squatState = 'up';
  let jjState = 'closed';
  let pushupState = 'up';

  const LEVELS = [
    { name:'Sedentário', min:0 },
    { name:'Em Movimento', min:50 },
    { name:'Ativo', min:150 },
    { name:'Atleta Campus', min:350 },
    { name:'Lenda do Campus', min:700 },
  ];

  function updateLevel(){
    let current = LEVELS[0], next = LEVELS[1];
    for(let i=0;i<LEVELS.length;i++){
      if(points >= LEVELS[i].min){ current = LEVELS[i]; next = LEVELS[i+1]; }
    }
    levelName.textContent = current.name;
    if(next){
      const span = next.min - current.min;
      const progress = Math.min(100, ((points - current.min) / span) * 100);
      levelBar.style.width = progress + '%';
      levelHint.textContent = `${points} / ${next.min} pts para ${next.name}`;
    } else {
      levelBar.style.width = '100%';
      levelHint.textContent = `${points} pts — nível máximo!`;
    }
  }

  function addPoints(p){
    points += p;
    pointCountEl.textContent = points;
    updateLevel();
  }

  function logFeed(text){
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `<b>${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</b> — ${text}`;
    feedEl.prepend(item);
    while(feedEl.children.length > 20) feedEl.removeChild(feedEl.lastChild);
  }

  function angle(a,b,c){
    const ab = { x:a.x-b.x, y:a.y-b.y };
    const cb = { x:c.x-b.x, y:c.y-b.y };
    const dot = ab.x*cb.x + ab.y*cb.y;
    const magAB = Math.hypot(ab.x, ab.y);
    const magCB = Math.hypot(cb.x, cb.y);
    if(magAB === 0 || magCB === 0) return null;
    let cos = dot / (magAB*magCB);
    cos = Math.max(-1, Math.min(1, cos));
    return Math.acos(cos) * (180/Math.PI);
  }

  function kp(pose, name){
    const p = pose.keypoints.find(k=>k.name === name);
    if(!p || p.score < 0.3) return null;
    return p;
  }

  const SKELETON = [
    ['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],
    ['right_shoulder','right_elbow'],['right_elbow','right_wrist'],
    ['left_shoulder','left_hip'],['right_shoulder','right_hip'],['left_hip','right_hip'],
    ['left_hip','left_knee'],['left_knee','left_ankle'],
    ['right_hip','right_knee'],['right_knee','right_ankle'],
  ];

  function drawPose(pose){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#CFFF3D';
    ctx.fillStyle = '#CFFF3D';
    SKELETON.forEach(([a,b])=>{
      const pa = kp(pose,a), pb = kp(pose,b);
      if(pa && pb){
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
    });
    pose.keypoints.forEach(p=>{
      if(p.score > 0.3){
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2*Math.PI);
        ctx.fill();
      }
    });
  }

  function evaluateSquat(pose){
    const hip = kp(pose,'left_hip') || kp(pose,'right_hip');
    const knee = kp(pose,'left_knee') || kp(pose,'right_knee');
    const ankle = kp(pose,'left_ankle') || kp(pose,'right_ankle');
    if(!hip || !knee || !ankle) return;
    const a = angle(hip, knee, ankle);
    if(a === null) return;
    if(a < 100 && squatState === 'up'){
      squatState = 'down';
    } else if(a > 155 && squatState === 'down'){
      squatState = 'up';
      reps++;
      repCountEl.textContent = reps;
      addPoints(10);
      logFeed(`Agachamento válido — <b>+10 pts</b>`);
    }
  }

  function evaluateJumpingJack(pose){
    const ls = kp(pose,'left_shoulder'), rs = kp(pose,'right_shoulder');
    const lw = kp(pose,'left_wrist'), rw = kp(pose,'right_wrist');
    const la = kp(pose,'left_ankle'), ra = kp(pose,'right_ankle');
    if(!ls || !rs || !lw || !rw || !la || !ra) return;
    const shoulderWidth = Math.hypot(rs.x-ls.x, rs.y-ls.y);
    const ankleSpread = Math.hypot(ra.x-la.x, ra.y-la.y);
    const armsUp = lw.y < ls.y && rw.y < rs.y;
    const legsApart = ankleSpread > shoulderWidth * 1.4;
    const open = armsUp && legsApart;
    if(open && jjState === 'closed'){
      jjState = 'open';
      reps++;
      repCountEl.textContent = reps;
      addPoints(8);
      logFeed(`Polichinelo válido — <b>+8 pts</b>`);
    } else if(!open && jjState === 'open'){
      jjState = 'closed';
    }
  }

  function evaluatePushup(pose){
    const shoulder = kp(pose,'left_shoulder') || kp(pose,'right_shoulder');
    const elbow = kp(pose,'left_elbow') || kp(pose,'right_elbow');
    const wrist = kp(pose,'left_wrist') || kp(pose,'right_wrist');
    if(!shoulder || !elbow || !wrist) return;
    const a = angle(shoulder, elbow, wrist);
    if(a === null) return;
    if(a < 95 && pushupState === 'up'){
      pushupState = 'down';
    } else if(a > 150 && pushupState === 'down'){
      pushupState = 'up';
      reps++;
      repCountEl.textContent = reps;
      addPoints(12);
      logFeed(`Flexão válida — <b>+12 pts</b>`);
    }
  }

  async function detectLoop(){
    if(!running) return;
    if(video.readyState >= 2){
      const poses = await detector.estimatePoses(video);
      if(poses.length > 0){
        const pose = poses[0];
        drawPose(pose);
        if(mode === 'squat') evaluateSquat(pose);
        else if(mode === 'jack') evaluateJumpingJack(pose);
        else evaluatePushup(pose);
      } else {
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
    }
    requestAnimationFrame(detectLoop);
  }

  async function start(){
    startBtn.disabled = true;
    camMsgText.textContent = 'Carregando o modelo de reconhecimento de movimento...';
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' }, audio:false });
      video.srcObject = stream;
      await new Promise(res => { video.onloadedmetadata = res; });
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if(!detector){
        await tf.setBackend('webgl');
        await tf.ready();
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        });
      }

      camMsg.style.display = 'none';
      statusDot.classList.add('live');
      statusText.textContent = 'câmera ativa';
      stopBtn.disabled = false;
      running = true;
      logFeed('Sessão iniciada');
      detectLoop();
    } catch(err){
      camMsgText.textContent = 'Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.';
      startBtn.disabled = false;
    }
  }

  function stop(){
    running = false;
    const stream = video.srcObject;
    if(stream){ stream.getTracks().forEach(t=>t.stop()); }
    video.srcObject = null;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    camMsg.style.display = 'flex';
    camMsgText.textContent = 'Sessão encerrada. Ative a câmera novamente quando quiser continuar.';
    startBtn.disabled = false;
    statusDot.classList.remove('live');
    statusText.textContent = 'câmera desligada';
    stopBtn.disabled = true;
    logFeed('Sessão encerrada');
  }

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  updateLevel();
})();