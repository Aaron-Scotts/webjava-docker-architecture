import ChartCanvas from "../components/ChartCanvas.jsx";

export default function AnalyticsView({ userTrendChart, userCategoryChart }) {
  return (
    <section className="panel">
      <h2>Your reading signal</h2>
      <div className="split">
        <div className="card">
          <h3>Rentals over time</h3>
          <div className="chart-wrap">
            {userTrendChart && <ChartCanvas type="line" data={userTrendChart.data} options={userTrendChart.options} />}
          </div>
        </div>
        <div className="card">
          <h3>Categories</h3>
          <div className="chart-wrap">
            {userCategoryChart && <ChartCanvas type="bar" data={userCategoryChart.data} options={userCategoryChart.options} />}
          </div>
        </div>
      </div>
    </section>
  );
}
