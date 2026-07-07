import ScheduledMatches from './components/ScheduledMatches';

function App() {
  const today = new Date().toISOString().slice(0, 10);
  const ENGLAND_CATEGORY_ID = 1;

  return (
    <div className="App">
      <ScheduledMatches date={today} categoryId={ENGLAND_CATEGORY_ID} />
    </div>
  );
}

export default App;
