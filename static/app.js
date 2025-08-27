(() => {
	const displayEl = document.getElementById('display');
	const startBtn = document.getElementById('startBtn');
	const stopBtn = document.getElementById('stopBtn');
	const resetBtn = document.getElementById('resetBtn');
	const historyBody = document.getElementById('historyBody');
	const progressCircle = document.getElementById('progressCircle');
	const historyToggle = document.getElementById('historyToggle');
	const historyPanel = document.getElementById('historyPanel');
	const historyDate = document.getElementById('historyDate');
	const miniBtn = document.getElementById('miniBtn');
	const miniOverlay = document.getElementById('miniOverlay');
	const miniDragHandle = document.getElementById('miniDragHandle');
	const miniTime = document.getElementById('miniTime');
	const miniClose = document.getElementById('miniClose');

	let timerInterval = null;
	let baseElapsedMs = 0;
	let startedAtMs = null; // epoch ms when currently running
	let allSessions = [];

	function fmtHMS(ms) {
		const totalSec = Math.floor(ms / 1000);
		const h = Math.floor(totalSec / 3600).toString().padStart(2,'0');
		const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2,'0');
		const s = Math.floor(totalSec % 60).toString().padStart(2,'0');
		return `${h}:${m}:${s}`;
	}

	function toNiceDateTime(iso){
		if(!iso) return '-';
		const d = new Date(iso);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth()+1).padStart(2,'0');
		const dd = String(d.getDate()).padStart(2,'0');
		const hh = String(d.getHours()).padStart(2,'0');
		const mi = String(d.getMinutes()).padStart(2,'0');
		const ss = String(d.getSeconds()).padStart(2,'0');
		return `Date : ${yyyy}-${mm}-${dd} , Time : ${hh}:${mi}:${ss}`;
	}

	function setDisplay(ms){
		const text = fmtHMS(ms);
		displayEl.textContent = text;
		miniTime && (miniTime.textContent = text);
		const p = ms > 0 ? 1 : 0;
		progressCircle && (progressCircle.style.setProperty('--p', `${(p*100).toFixed(2)}%`));
	}

	function startTicking(){
		if(timerInterval) return;
		timerInterval = setInterval(() => {
			const now = Date.now();
			const elapsed = baseElapsedMs + (startedAtMs ? (now - startedAtMs) : 0);
			setDisplay(elapsed);
		}, 1000);
	}
	function stopTicking(){
		if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
	}

	function scheduleMidnightResetFromIso(nowIso){
		const now = new Date(nowIso);
		const tomorrow = new Date(now);
		tomorrow.setDate(now.getDate() + 1);
		tomorrow.setHours(0,0,0,0);
		const ms = tomorrow.getTime() - now.getTime();
		setTimeout(() => {
			baseElapsedMs = 0;
			startedAtMs = null;
			setDisplay(0);
			refreshAll();
			refreshStatusAndReschedule();
		}, ms);
	}

	async function api(path, options){
		const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
		if(!res.ok) throw new Error('API error');
		return res.json();
	}

	function updateHistory(sessions){
		historyBody.innerHTML = '';
		const filterDate = historyDate && historyDate.value ? historyDate.value : null;
		const filtered = !filterDate ? sessions : sessions.filter(s => {
			const d = new Date(s.start);
			const yyyy = d.getFullYear();
			const mm = String(d.getMonth()+1).padStart(2,'0');
			const dd = String(d.getDate()).padStart(2,'0');
			return `${yyyy}-${mm}-${dd}` === filterDate;
		});
		filtered.forEach((s, idx) => {
			const tr = document.createElement('tr');
			const tdIdx = document.createElement('td'); tdIdx.textContent = String(idx + 1);
			const tdStart = document.createElement('td'); tdStart.textContent = toNiceDateTime(s.start);
			const tdStop = document.createElement('td'); tdStop.textContent = s.stop ? toNiceDateTime(s.stop) : '-';
			const tdDur = document.createElement('td'); tdDur.textContent = fmtHMS(s.duration_ms || 0);
			tr.append(tdIdx, tdStart, tdStop, tdDur);
			historyBody.appendChild(tr);
		});
	}

	function setTotals(t){
		// Update Today
		document.getElementById('todayHours').textContent = t.today.hours;
		document.getElementById('todayMinutes').textContent = t.today.minutes;
		document.getElementById('todaySeconds').textContent = t.today.seconds;
		
		// Update Week
		document.getElementById('weekHours').textContent = t.week.hours;
		document.getElementById('weekMinutes').textContent = t.week.minutes;
		document.getElementById('weekSeconds').textContent = t.week.seconds;
		
		// Update Month
		document.getElementById('monthHours').textContent = t.month.hours;
		document.getElementById('monthMinutes').textContent = t.month.minutes;
		document.getElementById('monthSeconds').textContent = t.month.seconds;
		
		// Update Year
		document.getElementById('yearHours').textContent = t.year.hours;
		document.getElementById('yearMinutes').textContent = t.year.minutes;
		document.getElementById('yearSeconds').textContent = t.year.seconds;
	}

	async function refreshAll(){
		const status = await api('/api/status');
		baseElapsedMs = status.base_elapsed_ms;
		startedAtMs = status.running ? Date.now() - status.running_elapsed_ms : null;
		setDisplay(baseElapsedMs + (startedAtMs ? (Date.now() - startedAtMs) : 0));
		if(status.running) { startBtn.disabled = true; stopBtn.disabled = false; startTicking(); }
		else { startBtn.disabled = false; stopBtn.disabled = true; stopTicking(); }

		allSessions = status.sessions || [];
		updateHistory(allSessions);

		const totals = await api('/api/reports');
		setTotals(totals);
	}

	async function refreshStatusAndReschedule(){
		const status = await api('/api/status');
		scheduleMidnightResetFromIso(status.server_now);
	}

	startBtn.addEventListener('click', async () => {
		await api('/api/start', { method: 'POST', body: JSON.stringify({}) });
		await refreshAll();
	});
	stopBtn.addEventListener('click', async () => {
		await api('/api/stop', { method: 'POST', body: JSON.stringify({}) });
		await refreshAll();
	});
	resetBtn.addEventListener('click', async () => {
		await api('/api/reset', { method: 'POST', body: JSON.stringify({}) });
		await refreshAll();
	});

	// Toggle history panel
	historyToggle && historyToggle.addEventListener('click', () => {
		const isHidden = historyPanel.style.display === 'none' || historyPanel.style.display === '';
		historyPanel.style.display = isHidden ? 'block' : 'none';
		historyToggle.textContent = isHidden ? 'Hide History' : 'Show History';
	});

	// Filter by date
	historyDate && historyDate.addEventListener('change', () => {
		updateHistory(allSessions);
	});

	// Mini overlay open/close
	miniBtn && miniBtn.addEventListener('click', () => {
		miniOverlay.style.display = 'grid';
	});
	miniClose && miniClose.addEventListener('click', () => {
		miniOverlay.style.display = 'none';
	});

	// Drag logic
	(function initDrag(){
		if(!miniOverlay || !miniDragHandle) return;
		let isDown = false; let startX = 0; let startY = 0; let startLeft = 0; let startTop = 0;
		miniDragHandle.addEventListener('mousedown', (e) => {
			isDown = true; miniOverlay.classList.add('dragging');
			startX = e.clientX; startY = e.clientY;
			const rect = miniOverlay.getBoundingClientRect();
			startLeft = rect.left; startTop = rect.top;
			document.body.style.userSelect = 'none';
		});
		document.addEventListener('mousemove', (e) => {
			if(!isDown) return;
			const dx = e.clientX - startX; const dy = e.clientY - startY;
			miniOverlay.style.left = `${startLeft + dx}px`;
			miniOverlay.style.top = `${startTop + dy}px`;
			miniOverlay.style.right = 'auto'; miniOverlay.style.bottom = 'auto';
		});
		document.addEventListener('mouseup', () => {
			if(!isDown) return; isDown = false; miniOverlay.classList.remove('dragging');
			document.body.style.userSelect = '';
		});
	})();

	refreshAll();
	refreshStatusAndReschedule();
})();
