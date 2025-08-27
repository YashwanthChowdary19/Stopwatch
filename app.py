from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta, timezone
import json
import os
from threading import Lock

app = Flask(__name__)

IST = timezone(timedelta(hours=5, minutes=30))

DATA_FILE = 'storage.json'
_data_lock = Lock()

def ensure_data_file_exists() -> None:
	if not os.path.exists(DATA_FILE):
		initial = {
			"sessions": [],
			"running": False,
			"current_start": None,
			"last_reset_date": None
		}
		with open(DATA_FILE, 'w', encoding='utf-8') as f:
			json.dump(initial, f, ensure_ascii=False, indent=2)


def load_data() -> dict:
	ensure_data_file_exists()
	with _data_lock:
		with open(DATA_FILE, 'r', encoding='utf-8') as f:
			return json.load(f)


def save_data(data: dict) -> None:
	with _data_lock:
		with open(DATA_FILE, 'w', encoding='utf-8') as f:
			json.dump(data, f, ensure_ascii=False, indent=2)


def now_ist() -> datetime:
	return datetime.now(tz=IST)


def to_iso(dt: datetime) -> str:
	return dt.astimezone(IST).isoformat()


def from_iso(s: str) -> datetime:
	return datetime.fromisoformat(s)


def start_of_day_ist(dt: datetime) -> datetime:
	local = dt.astimezone(IST)
	return datetime(local.year, local.month, local.day, tzinfo=IST)


def next_day_ist(dt: datetime) -> datetime:
	return start_of_day_ist(dt) + timedelta(days=1)


def month_bounds_ist(dt: datetime):
	local = dt.astimezone(IST)
	start = datetime(local.year, local.month, 1, tzinfo=IST)
	if local.month == 12:
		end = datetime(local.year + 1, 1, 1, tzinfo=IST)
	else:
		end = datetime(local.year, local.month + 1, 1, tzinfo=IST)
	return start, end


def year_bounds_ist(dt: datetime):
	local = dt.astimezone(IST)
	start = datetime(local.year, 1, 1, tzinfo=IST)
	end = datetime(local.year + 1, 1, 1, tzinfo=IST)
	return start, end


def clip_overlap_ms(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> int:
	start = max(a_start, b_start)
	end = min(a_end, b_end)
	if end <= start:
		return 0
	return int((end - start).total_seconds() * 1000)


def compute_total_ms_in_window(sessions: list, window_start: datetime, window_end: datetime, running: bool, current_start: str | None) -> int:
	total = 0
	for s in sessions:
		start = from_iso(s['start']) if isinstance(s['start'], str) else s['start']
		if s.get('stop'):
			stop = from_iso(s['stop']) if isinstance(s['stop'], str) else s['stop']
		else:
			# Should not happen in stored sessions; open session handled below
			continue
		total += clip_overlap_ms(start, stop, window_start, window_end)
	# include running session overlap with now
	if running and current_start:
		rs = from_iso(current_start)
		rnow = now_ist()
		total += clip_overlap_ms(rs, rnow, window_start, window_end)
	return total


@app.route('/')
def index():
	return render_template('index.html')


# Health route for quick checks
@app.route('/health')
def health():
	return jsonify({"status": "ok", "now": to_iso(now_ist())})


@app.route('/api/start', methods=['POST'])
def api_start():
	data = load_data()
	if data.get('running'):
		return jsonify({"ok": True, "message": "Already running"})
	data['running'] = True
	data['current_start'] = to_iso(now_ist())
	save_data(data)
	return jsonify({"ok": True})


@app.route('/api/stop', methods=['POST'])
def api_stop():
	data = load_data()
	if not data.get('running'):
		return jsonify({"ok": True, "message": "Already stopped"})
	start_iso = data.get('current_start')
	if not start_iso:
		# Inconsistent; recover by setting stopped state
		data['running'] = False
		save_data(data)
		return jsonify({"ok": True, "message": "Recovered state"})
	start_dt = from_iso(start_iso)
	stop_dt = now_ist()
	duration_ms = int((stop_dt - start_dt).total_seconds() * 1000)
	data.setdefault('sessions', []).append({
		"start": to_iso(start_dt),
		"stop": to_iso(stop_dt),
		"duration_ms": duration_ms
	})
	data['running'] = False
	data['current_start'] = None
	save_data(data)
	return jsonify({"ok": True})


@app.route('/api/reset', methods=['POST'])
def api_reset():
	data = load_data()
	now = now_ist()
	today_start = start_of_day_ist(now)
	
	# Only remove today's sessions, keep historical data
	data['sessions'] = [s for s in data.get('sessions', []) 
					   if from_iso(s['start']) < today_start]
	
	# Stop if running
	if data.get('running'):
		data['running'] = False
		data['current_start'] = None
	
	save_data(data)
	return jsonify({"ok": True, "message": "Today's timer reset completed"})


@app.route('/api/status', methods=['GET'])
def api_status():
	data = load_data()
	now = now_ist()
	today_start = start_of_day_ist(now)

	base_elapsed_ms = compute_total_ms_in_window(
		data.get('sessions', []), today_start, now, data.get('running', False), data.get('current_start')
	)
	# running_elapsed_ms is additional elapsed since start within today window
	running_elapsed_ms = 0
	if data.get('running') and data.get('current_start'):
		rs = from_iso(data['current_start'])
		# Only count from max(rs, today_start)
		running_elapsed_ms = int((now - max(rs, today_start)).total_seconds() * 1000) if now > max(rs, today_start) else 0

	return jsonify({
		"running": bool(data.get('running')),
		"current_start": data.get('current_start'),
		"sessions": data.get('sessions', []),
		"base_elapsed_ms": base_elapsed_ms,
		"running_elapsed_ms": running_elapsed_ms,
		"server_now": to_iso(now)
	})


@app.route('/api/reports', methods=['GET'])
def api_reports():
	data = load_data()
	sessions = data.get('sessions', [])
	now = now_ist()
	running = data.get('running', False)
	current_start = data.get('current_start')

	# Today
	today_start = start_of_day_ist(now)
	today_end = next_day_ist(now)
	today_ms = compute_total_ms_in_window(sessions, today_start, today_end, running, current_start)

	# Past 7 days (including today)
	week_start = start_of_day_ist(now) - timedelta(days=6)
	week_end = today_end
	week_ms = compute_total_ms_in_window(sessions, week_start, week_end, running, current_start)

	# Current month
	month_start, month_end = month_bounds_ist(now)
	month_ms = compute_total_ms_in_window(sessions, month_start, month_end, running, current_start)

	# Current year
	year_start, year_end = year_bounds_ist(now)
	year_ms = compute_total_ms_in_window(sessions, year_start, year_end, running, current_start)

	def fmt_time_breakdown(ms: int) -> dict:
		total_seconds = ms // 1000
		hours = total_seconds // 3600
		minutes = (total_seconds % 3600) // 60
		seconds = total_seconds % 60
		return {
			"hours": f"{hours} hrs",
			"minutes": f"{minutes} min", 
			"seconds": f"{seconds} sec"
		}

	return jsonify({
		"today": fmt_time_breakdown(today_ms),
		"week": fmt_time_breakdown(week_ms),
		"month": fmt_time_breakdown(month_ms),
		"year": fmt_time_breakdown(year_ms)
	})


if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000, debug=True)
