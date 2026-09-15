import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Game, Score, TOTAL_SHOTS, SHOTS_PER_SETUP, createGame, currentShot, isComplete, totalScore, updateScore } from './domain';
import { createRepository, StorageError } from './storage';
import './styles.css';

type View = 'home' | 'score' | 'history' | 'detail';
const repository = createRepository();

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function App() {
  const [view, setView] = useState<View>('home');
  const [active, setActive] = useState<Game | null>(null);
  const [completed, setCompleted] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selected = selectedId ? completed.find((game) => game.id === selectedId) ?? null : null;

  useEffect(() => {
    try {
      const savedActive = repository.getActive();
      setActive(savedActive);
      setCompleted(repository.listCompleted());
      if (savedActive) setView('score');
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Unable to load saved scorecards.');
    }
  }, []);

  const startGame = (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerName.trim()) return;
    const game = createGame(playerName);
    try {
      repository.saveActive(game);
      setActive(game);
      setPlayerName('');
      setView('score');
      setError(null);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Unable to save the new scorecard.');
    }
  };

  const saveScore = (shot: number, value: Score) => {
    if (!active) return;
    const next = updateScore(active, shot, value);
    try {
      repository.saveActive(next);
      setActive(next);
      setError(null);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Unable to save the score.');
    }
  };

  const finish = () => {
    if (!active || !isComplete(active)) return;
    const completedGame = { ...active, completedAt: new Date().toISOString() };
    try {
      repository.complete(completedGame);
      setActive(null);
      setCompleted(repository.listCompleted());
      setView('home');
      setError(null);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Unable to complete the scorecard.');
    }
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setView('home')} aria-label="Go to home">PRECISION<span>SHOOTING</span></button>
        <nav aria-label="Primary navigation">
          <button className={view === 'history' || view === 'detail' ? 'nav-active' : ''} onClick={() => setView('history')}>Scorecards</button>
        </nav>
      </header>
      <main>
        {error && <div className="error" role="alert">{error}</div>}
        {view === 'home' && <Home active={active} playerName={playerName} setPlayerName={setPlayerName} startGame={startGame} resume={() => setView('score')} openHistory={() => setView('history')} />}
        {view === 'score' && active && <Scoring game={active} saveScore={saveScore} finish={finish} cancel={() => { try { repository.clearActive(); setActive(null); setView('home'); } catch (error) { setError(error instanceof StorageError ? error.message : 'Unable to clear the active scorecard.'); } }} />}
        {view === 'history' && <History games={completed} openDetail={openDetail} />}
        {view === 'detail' && selected && <Detail game={selected} back={() => setView('history')} />}
        {view === 'detail' && !selected && <History games={completed} openDetail={openDetail} />}
      </main>
      <footer>Five setups · Twenty shots · Maximum 100 points</footer>
    </div>
  );
}

function Home({ active, playerName, setPlayerName, startGame, resume, openHistory }: { active: Game | null; playerName: string; setPlayerName: (value: string) => void; startGame: (event: React.FormEvent) => void; resume: () => void; openHistory: () => void }) {
  return <section className="home">
    <div className="hero"><p className="eyebrow">PÉTANQUE PRECISION SHOOTING</p><h1>Focus.<br /><em>Fire.</em><br />Score.</h1><p className="intro">A clear, fast scorecard for the moments that count.</p></div>
    {active ? <button className="primary full" onClick={resume}>Resume {active.playerName}'s game <span>→</span></button> : <form onSubmit={startGame} className="new-game card">
      <label htmlFor="player">Player name</label><input id="player" value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Enter name to begin" autoComplete="name" />
      <button className="primary full" type="submit" disabled={!playerName.trim()}>Start new game <span>→</span></button>
    </form>}
    <button className="secondary full" onClick={openHistory}>View previous scorecards <span>↗</span></button>
  </section>;
}

function Scoring({ game, saveScore, finish, cancel }: { game: Game; saveScore: (shot: number, score: Score) => void; finish: () => void; cancel: () => void }) {
  const [cursor, setCursor] = useState(() => currentShot(game));
  const shot = Math.min(cursor, TOTAL_SHOTS - 1);
  const entry = game.entries[shot];
  const done = isComplete(game);
  const chooseScore = (value: Score) => {
    saveScore(shot, value);
    if (shot < TOTAL_SHOTS - 1) setCursor(shot + 1);
  };
  return <section className="scoring">
    <div className="score-top"><button className="text-button" onClick={cancel}>← Exit</button><span className="progress">{Math.min(shot + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}</span></div>
    <div className="score-heading"><p className="eyebrow">SETUP {entry.setup + 1} OF 5 · SHOT {(shot % SHOTS_PER_SETUP) + 1} OF 4</p><h2>{game.playerName}</h2><div className="total"><span>Current score</span><strong>{totalScore(game)}</strong></div></div>
    <div className="score-buttons" aria-label="Score selection">{([0, 1, 3, 5] as Score[]).map((value) => <button key={value} className={`score-button score-${value} ${entry.value === value ? 'selected' : ''}`} onClick={() => chooseScore(value)} aria-label={`Score ${value}`}>{value}</button>)}</div>
    <div className="score-nav"><button className="secondary" disabled={shot === 0} onClick={() => setCursor((value) => Math.max(0, value - 1))}>← Previous</button><button className="secondary" disabled={!done && entry.value === null} onClick={() => { if (done) finish(); else setCursor((value) => Math.min(TOTAL_SHOTS - 1, value + 1)); }}>{done ? 'Finish scorecard ✓' : 'Next →'}</button></div>
    <p className="hint">Tap the result of each shot. You can change any result before finishing.</p>
  </section>;
}

function History({ games, openDetail }: { games: Game[]; openDetail: (id: string) => void }) {
  return <section className="history"><div className="section-heading"><p className="eyebrow">ARCHIVE</p><h1>Previous scorecards</h1></div>{games.length === 0 ? <div className="empty card"><p>No completed scorecards yet.</p><span>Your finished games will appear here.</span></div> : <div className="game-list">{games.map((game) => <button className="game-card card" key={game.id} onClick={() => openDetail(game.id)}><span><strong>{game.playerName}</strong><small>{formatDate(game.completedAt ?? game.createdAt)}</small></span><b>{totalScore(game)}<small>/ 100</small></b><span className="arrow">→</span></button>)}</div>}</section>;
}

function Detail({ game, back }: { game: Game; back: () => void }) {
  return <section className="detail"><button className="text-button" onClick={back}>← All scorecards</button><div className="section-heading"><p className="eyebrow">COMPLETED SCORECARD</p><h1>{game.playerName}</h1><p className="muted">{formatDate(game.completedAt ?? game.createdAt)}</p></div><div className="detail-total card"><span>Final score</span><strong>{totalScore(game)}<small> / 100</small></strong></div><div className="entries">{Array.from({ length: 5 }, (_, setup) => <div className="setup-row card" key={setup}><div><span className="eyebrow">SETUP {setup + 1}</span><div className="shot-values">{game.entries.slice(setup * 4, setup * 4 + 4).map((entry) => <span key={entry.shot}>{entry.value}</span>)}</div></div><strong>{game.entries.slice(setup * 4, setup * 4 + 4).reduce((sum, entry) => sum + (entry.value ?? 0), 0)}</strong></div>)}</div></section>;
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
}
