export default function TestSimple() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Teste Simples</h1>
      <p>Esta é uma página de teste simples para verificar se o servidor está funcionando.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-700">✅ Se você está vendo esta mensagem, o servidor está funcionando corretamente!</p>
      </div>
    </div>
  )
}