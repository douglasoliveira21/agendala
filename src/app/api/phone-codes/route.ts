import { NextRequest, NextResponse } from 'next/server'

// Códigos DDI (países) mais comuns
const countryDDI = [
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', name: 'Canadá', flag: '🇨🇦' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: '+598', name: 'Uruguai', flag: '🇺🇾' },
  { code: '+595', name: 'Paraguai', flag: '🇵🇾' },
  { code: '+591', name: 'Bolívia', flag: '🇧🇴' },
  { code: '+593', name: 'Equador', flag: '🇪🇨' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+34', name: 'Espanha', flag: '🇪🇸' },
  { code: '+33', name: 'França', flag: '🇫🇷' },
  { code: '+39', name: 'Itália', flag: '🇮🇹' },
  { code: '+49', name: 'Alemanha', flag: '🇩🇪' },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
]

// Códigos DDD do Brasil por região
const brazilDDD = [
  // Região Sudeste
  { code: '11', city: 'São Paulo', state: 'SP', region: 'Sudeste' },
  { code: '12', city: 'São José dos Campos', state: 'SP', region: 'Sudeste' },
  { code: '13', city: 'Santos', state: 'SP', region: 'Sudeste' },
  { code: '14', city: 'Bauru', state: 'SP', region: 'Sudeste' },
  { code: '15', city: 'Sorocaba', state: 'SP', region: 'Sudeste' },
  { code: '16', city: 'Ribeirão Preto', state: 'SP', region: 'Sudeste' },
  { code: '17', city: 'São José do Rio Preto', state: 'SP', region: 'Sudeste' },
  { code: '18', city: 'Presidente Prudente', state: 'SP', region: 'Sudeste' },
  { code: '19', city: 'Campinas', state: 'SP', region: 'Sudeste' },
  
  { code: '21', city: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste' },
  { code: '22', city: 'Campos dos Goytacazes', state: 'RJ', region: 'Sudeste' },
  { code: '24', city: 'Petrópolis', state: 'RJ', region: 'Sudeste' },
  
  { code: '27', city: 'Vitória', state: 'ES', region: 'Sudeste' },
  { code: '28', city: 'Cachoeiro de Itapemirim', state: 'ES', region: 'Sudeste' },
  
  { code: '31', city: 'Belo Horizonte', state: 'MG', region: 'Sudeste' },
  { code: '32', city: 'Juiz de Fora', state: 'MG', region: 'Sudeste' },
  { code: '33', city: 'Governador Valadares', state: 'MG', region: 'Sudeste' },
  { code: '34', city: 'Uberlândia', state: 'MG', region: 'Sudeste' },
  { code: '35', city: 'Poços de Caldas', state: 'MG', region: 'Sudeste' },
  { code: '37', city: 'Divinópolis', state: 'MG', region: 'Sudeste' },
  { code: '38', city: 'Montes Claros', state: 'MG', region: 'Sudeste' },
  
  // Região Sul
  { code: '41', city: 'Curitiba', state: 'PR', region: 'Sul' },
  { code: '42', city: 'Ponta Grossa', state: 'PR', region: 'Sul' },
  { code: '43', city: 'Londrina', state: 'PR', region: 'Sul' },
  { code: '44', city: 'Maringá', state: 'PR', region: 'Sul' },
  { code: '45', city: 'Foz do Iguaçu', state: 'PR', region: 'Sul' },
  { code: '46', city: 'Francisco Beltrão', state: 'PR', region: 'Sul' },
  
  { code: '47', city: 'Joinville', state: 'SC', region: 'Sul' },
  { code: '48', city: 'Florianópolis', state: 'SC', region: 'Sul' },
  { code: '49', city: 'Chapecó', state: 'SC', region: 'Sul' },
  
  { code: '51', city: 'Porto Alegre', state: 'RS', region: 'Sul' },
  { code: '53', city: 'Pelotas', state: 'RS', region: 'Sul' },
  { code: '54', city: 'Caxias do Sul', state: 'RS', region: 'Sul' },
  { code: '55', city: 'Santa Maria', state: 'RS', region: 'Sul' },
  
  // Região Nordeste
  { code: '71', city: 'Salvador', state: 'BA', region: 'Nordeste' },
  { code: '73', city: 'Ilhéus', state: 'BA', region: 'Nordeste' },
  { code: '74', city: 'Juazeiro', state: 'BA', region: 'Nordeste' },
  { code: '75', city: 'Feira de Santana', state: 'BA', region: 'Nordeste' },
  { code: '77', city: 'Barreiras', state: 'BA', region: 'Nordeste' },
  
  { code: '79', city: 'Aracaju', state: 'SE', region: 'Nordeste' },
  
  { code: '81', city: 'Recife', state: 'PE', region: 'Nordeste' },
  { code: '87', city: 'Petrolina', state: 'PE', region: 'Nordeste' },
  
  { code: '82', city: 'Maceió', state: 'AL', region: 'Nordeste' },
  
  { code: '83', city: 'João Pessoa', state: 'PB', region: 'Nordeste' },
  
  { code: '84', city: 'Natal', state: 'RN', region: 'Nordeste' },
  
  { code: '85', city: 'Fortaleza', state: 'CE', region: 'Nordeste' },
  { code: '88', city: 'Juazeiro do Norte', state: 'CE', region: 'Nordeste' },
  
  { code: '86', city: 'Teresina', state: 'PI', region: 'Nordeste' },
  { code: '89', city: 'Picos', state: 'PI', region: 'Nordeste' },
  
  { code: '98', city: 'São Luís', state: 'MA', region: 'Nordeste' },
  { code: '99', city: 'Imperatriz', state: 'MA', region: 'Nordeste' },
  
  // Região Centro-Oeste
  { code: '61', city: 'Brasília', state: 'DF', region: 'Centro-Oeste' },
  
  { code: '62', city: 'Goiânia', state: 'GO', region: 'Centro-Oeste' },
  { code: '64', city: 'Rio Verde', state: 'GO', region: 'Centro-Oeste' },
  
  { code: '65', city: 'Cuiabá', state: 'MT', region: 'Centro-Oeste' },
  { code: '66', city: 'Rondonópolis', state: 'MT', region: 'Centro-Oeste' },
  
  { code: '67', city: 'Campo Grande', state: 'MS', region: 'Centro-Oeste' },
  
  // Região Norte
  { code: '68', city: 'Rio Branco', state: 'AC', region: 'Norte' },
  
  { code: '69', city: 'Porto Velho', state: 'RO', region: 'Norte' },
  
  { code: '91', city: 'Belém', state: 'PA', region: 'Norte' },
  { code: '93', city: 'Santarém', state: 'PA', region: 'Norte' },
  { code: '94', city: 'Marabá', state: 'PA', region: 'Norte' },
  
  { code: '92', city: 'Manaus', state: 'AM', region: 'Norte' },
  { code: '97', city: 'Coari', state: 'AM', region: 'Norte' },
  
  { code: '95', city: 'Boa Vista', state: 'RR', region: 'Norte' },
  
  { code: '96', city: 'Macapá', state: 'AP', region: 'Norte' },
  
  { code: '63', city: 'Palmas', state: 'TO', region: 'Norte' },
]

// GET /api/phone-codes - Listar códigos de telefone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'ddi' ou 'ddd'
    const country = searchParams.get('country') // para filtrar DDD por país
    const region = searchParams.get('region') // para filtrar DDD por região

    if (type === 'ddi') {
      return NextResponse.json({
        success: true,
        data: countryDDI
      })
    }

    if (type === 'ddd') {
      let filteredDDD = brazilDDD

      if (region) {
        filteredDDD = brazilDDD.filter(ddd => 
          ddd.region.toLowerCase() === region.toLowerCase()
        )
      }

      // Agrupar por região para melhor organização
      const groupedByRegion = filteredDDD.reduce((acc, ddd) => {
        if (!acc[ddd.region]) {
          acc[ddd.region] = []
        }
        acc[ddd.region].push(ddd)
        return acc
      }, {} as Record<string, typeof brazilDDD>)

      return NextResponse.json({
        success: true,
        data: {
          all: filteredDDD,
          byRegion: groupedByRegion
        }
      })
    }

    // Retornar ambos se não especificado
    return NextResponse.json({
      success: true,
      data: {
        ddi: countryDDI,
        ddd: {
          all: brazilDDD,
          byRegion: brazilDDD.reduce((acc, ddd) => {
            if (!acc[ddd.region]) {
              acc[ddd.region] = []
            }
            acc[ddd.region].push(ddd)
            return acc
          }, {} as Record<string, typeof brazilDDD>)
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar códigos de telefone:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}