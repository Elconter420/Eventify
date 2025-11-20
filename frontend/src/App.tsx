import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">🎉 Eventify</h1>
        <p className="text-sm">Sistema de Gestión de Eventos</p>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            ¡Bienvenido a Eventify!
          </h2>
          <p className="text-gray-600">
            Plataforma para crear y gestionar eventos de manera eficiente.
          </p>
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-green-800">
              ✅ El proyecto ha sido inicializado correctamente
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;