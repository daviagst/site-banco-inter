import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import '@fortawesome/fontawesome-free/css/all.min.css'

gsap.registerPlugin(ScrollTrigger)

//Cena
const scene = new THREE.Scene()
scene.background = null

//Camera
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 6

//Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.querySelector('.primeira-tela').appendChild(renderer.domElement)

//Luzes
const ambientLight = new THREE.AmbientLight('#ffffff', 1)
scene.add(ambientLight)

const mainLight = new THREE.DirectionalLight('#ffffff', 3)
mainLight.position.set(3, 4, 5)
scene.add(mainLight)

// Luz de preenchimento para clarear a lateral do cartão
const fillLight = new THREE.DirectionalLight('#fff0d6', 1.5)
fillLight.position.set(-3, -2, 4)
scene.add(fillLight)

//Cartao 3d
const loader = new GLTFLoader()
let card

// Cria uma imagem de sombra usando um degradê
// Cria uma pequena imagem com um degradê transparente
const shadowCanvas = document.createElement('canvas')
shadowCanvas.width = 256
shadowCanvas.height = 256

const context = shadowCanvas.getContext('2d')

const gradient = context.createRadialGradient(
    128, 128, 0,
    128, 128, 128
)

gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)')
gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.4)')
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

context.fillStyle = gradient
context.fillRect(0, 0, 256, 256)

// Usa essa imagem em um plano alongado
const shadowTexture = new THREE.CanvasTexture(shadowCanvas)

const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.5
})

const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 0.22),
    shadowMaterial
)

shadow.position.set(1.9, -0.55, -0.3)

scene.add(shadow)

loader.load('/arquivos3D/cartao-inter-frente-verso.glb',
    (gltf) => {
        const model = gltf.scene

        //Descobrir o tamanho e o centro do cartão
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        //Centraliza o cartao
        model.position.sub(center)

        card = new THREE.Group()
        card.add(model)

        //Ajusta o tamanho independentemente da escala de exportação
        const largestDimension = Math.max(size.x, size.y, size.z)
        card.scale.setScalar(1.4 / largestDimension)

        //Inclinação inicial
        card.position.set(1.9, 0.35, 0)
        card.rotation.set(1.5, -0.4, -0.1)

        scene.add(card)

        // Uma única sequência controla o cartão e sua sombra
        const floating = gsap.timeline({
            repeat: -1,
            yoyo: true,
            defaults: {
                duration: 2.5,
                ease: 'sine.inOut'
            }
        })

        floating.to(card.position, {
            y: '+=0.1'
        }, 0)

        floating.to(shadow.scale, {
            x: 1.08,
            y: 1.12
        }, 0)

        floating.to(shadowMaterial, {
            opacity: 0.5
        }, 0)
    },

    undefined,

    (error) => {
        console.error('Erro ao carregar o cartão:', error);
    }
)


//Redesenha a cena continuamente
renderer.setAnimationLoop(() => {
    renderer.render(scene, camera)
})

//Ajusta a cena quando o navegador muda de tamanho
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const primeiraTela = document.querySelector('.primeira-tela')
const faixa = document.querySelector('.hero-cta')
const botao = document.querySelector('.hero-botao')
const destino = document.querySelector('#proxima-secao')

// Calcula a posição da ponta direita da faixa
function calcularPercurso() {
    const estilo = getComputedStyle(faixa)

    return Math.max(
        0,
        faixa.clientWidth -
        botao.offsetWidth -
        parseFloat(estilo.paddingLeft) -
        parseFloat(estilo.paddingRight)
    )
}

// Começa à esquerda e termina à direita
gsap.fromTo(
    botao,
    {
        x: 0
    },
    {
        x: () => calcularPercurso(),
        ease: 'none',

        scrollTrigger: {
            trigger: primeiraTela,
            start: 'top top',
            end: () => `+=${window.innerHeight * 0.8}`,

            scrub: true,
            pin: primeiraTela,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,

            onUpdate: (self) => {
                gsap.set(botao, {
                    backgroundColor:
                        self.progress >= 1 ? '#ff8700' : '#414141'
                })
            }
        }
    }
)

// Atualiza as medidas depois de carregar a fonte
document.fonts.ready.then(() => {
    ScrollTrigger.refresh()
})

// Atalho por clique ou teclado
botao.addEventListener('click', () => {
    destino.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    })
})


// Animação de entrada da página
const reduzirAnimacoes = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
)

if (!reduzirAnimacoes.matches) {
    const entrada = gsap.timeline({
        paused: true,
        defaults: {
            ease: 'power3.out'
        }
    })

    entrada.from('.cabecalho', {
        y: -15,
        autoAlpha: 0,
        duration: 0.7
    }, 0)

    entrada.from('.titulo-texto', {
        yPercent: 110,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.16
    }, 0.15)

    entrada.from('.hero-cta', {
        y: 18,
        autoAlpha: 0,
        duration: 0.7
    }, 0.65)

    // Espera a fonte para evitar mudanças no texto durante a entrada
    document.fonts.ready.then(() => {
        entrada.play()
    })
}

const galeria = document.querySelector('#proxima-secao')
const trilho = document.querySelector('.galeria-trilho')
const cardsGaleria = gsap.utils.toArray('.galeria-card')
const frasesGaleria = gsap.utils.toArray('.galeria-frase')

// Distância entre o começo de um cartão e o próximo
function passoDaGaleria() {
    return cardsGaleria[1].offsetLeft - cardsGaleria[0].offsetLeft
}

const sequenciaGaleria = gsap.timeline({
    scrollTrigger: {
        trigger: galeria,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        scrub: 0.6,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
    }
})

// Primeira frase aparece
sequenciaGaleria.fromTo(
    frasesGaleria[0],
    { y: 40, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.35 },
    0
)

// Primeira imagem sai; segunda entra
sequenciaGaleria.to(trilho, {
    x: () => -passoDaGaleria(),
    duration: 1,
    ease: 'none'
}, 0.6)

// Segunda frase aparece durante a chegada
sequenciaGaleria.fromTo(
    frasesGaleria[1],
    { y: 40, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.35 },
    1.25
)

// Segunda imagem sai; terceira entra
sequenciaGaleria.to(trilho, {
    x: () => -passoDaGaleria() * 2,
    duration: 1,
    ease: 'none'
}, 1.9)

// Terceira frase aparece
sequenciaGaleria.fromTo(
    frasesGaleria[2],
    { y: 40, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.35 },
    2.55
)

// Reserva um pequeno trecho de rolagem para ler a última frase
sequenciaGaleria.to({}, { duration: 0.4 })

document.fonts.ready.then(() => {
    ScrollTrigger.refresh()
})

//Entrada da seção Global Account
const animacaoGlobal = gsap.matchMedia()

animacaoGlobal.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
        const entradaGlobal = gsap.timeline({
            scrollTrigger: {
                trigger: '.global-account',
                start: 'top 75%',
                once: true
            },
            defaults: {
                duration: 0.9,
                ease: 'power3.out'
            }
        })

        entradaGlobal.fromTo(
            '.global-imagem',
            { x: -35, autoAlpha: 0 },
            { x: 0, autoAlpha: 1 },
            0
        )

        entradaGlobal.fromTo(
            '.global-texto h2',
            { y: 25, autoAlpha: 0 },
            { y: 0, autoAlpha: 1 },
            0.15
        )

        entradaGlobal.fromTo(
            '.global-texto p',
            { y: 25, autoAlpha: 0 },
            { y: 0, autoAlpha: 1 },
            0.3
        )

        entradaGlobal.fromTo(
            '.global-botao',
            {
                y: 20,
                autoAlpha: 0,
                scale: 0.95
            },
            {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                duration: 0.3
            },
            0.1
        )
    }
)

// Parallax da seção Conta PJ
const parallaxPJ = gsap.matchMedia()

parallaxPJ.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
        gsap.fromTo(
            '.pj-fundo',
            {
                yPercent: -20
            },
            {
                yPercent: 20,
                ease: 'none',

                scrollTrigger: {
                    trigger: '.conta-pj',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        )
    }
)

const tituloPJ = document.querySelector('#titulo-pj')

// Preserva o texto completo para leitores de tela
tituloPJ.setAttribute(
    'aria-label',
    tituloPJ.textContent.replace(/\s+/g, ' ').trim()
)

// Encontra os textos, inclusive dentro dos trechos laranja
const leitorPJ = document.createTreeWalker(
    tituloPJ,
    NodeFilter.SHOW_TEXT
)

const textosPJ = []

while (leitorPJ.nextNode()) {
    textosPJ.push(leitorPJ.currentNode)
}

// Separa as letras, mantendo as palavras e os espaços
textosPJ.forEach((texto) => {
    const fragmento = document.createDocumentFragment()
    const partes = texto.textContent.match(/\S+|\s+/g) || []

    partes.forEach((parte) => {
        if (/^\s+$/.test(parte)) {
            fragmento.appendChild(document.createTextNode(parte))
            return
        }

        const palavra = document.createElement('span')
        palavra.className = 'pj-palavra'
        palavra.setAttribute('aria-hidden', 'true')

        Array.from(parte).forEach((caractere) => {
            const letra = document.createElement('span')
            letra.className = 'pj-letra'
            letra.textContent = caractere

            palavra.appendChild(letra)
        })

        fragmento.appendChild(palavra)
    })

    texto.replaceWith(fragmento)
})

// Anima as letras quando o título entra na tela
const letrasPJ = gsap.matchMedia()

letrasPJ.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
        gsap.fromTo(
            '#titulo-pj .pj-letra',
            {
                yPercent: 115,
                opacity: 0
            },
            {
                yPercent: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.025,
                ease: 'power3.out',

                scrollTrigger: {
                    trigger: '#titulo-pj',
                    start: 'top 85%',
                    once: true
                }
            }
        )
    }
)

const palcoCartoes = document.querySelector('.cartoes-palco')
const opcoesCartoes = gsap.utils.toArray('.cartao-opcao')
const detalhesCartao = document.querySelector('.cartao-detalhes')
const nomeCartao = document.querySelector('.cartao-nome')
const descricaoCartao = document.querySelector('.cartao-descricao')
const voltarCartoes = document.querySelector('.cartoes-voltar')
const instrucaoCartoes = document.querySelector('.cartoes-instrucao')

// Textos provisórios: substitua pelos conteúdos finais
const dadosCartoes = {
    gold: {
        nome: 'Gold',
        descricao: 'Sem anuidade'
    },
    platinum: {
        nome: 'Platinum',
        descricao: 'Sem anuidade'
    },
    prime: {
        nome: 'Prime',
        descricao: 'Sem anuidade'
    },
    win: {
        nome: 'Win',
        descricao: 'Sem anuidade'
    }
}

const movimentoCartoes = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
)

let cartaoSelecionado = null

// Usa o centro de cada botão como referência
gsap.set(opcoesCartoes, {
    xPercent: -50,
    yPercent: -50
})

// Organiza os cartões conforme o estado da seção
function posicionarCartoes(animar = true) {
    const largura = palcoCartoes.clientWidth
    const celular = window.innerWidth <= 760
    const centroY = celular ? 190 : 360
    const larguraCartao = opcoesCartoes[0].offsetWidth

    const restantes = cartaoSelecionado === null
        ? []
        : [1, 2, 3].map(
            (passo) => (cartaoSelecionado + passo) % opcoesCartoes.length
        )

    opcoesCartoes.forEach((botao, indice) => {
        let x
        let escala
        let camada

        if (cartaoSelecionado === null) {
            // Todos agrupados no centro
            x = largura / 2
                + (indice - 1.5) * larguraCartao * 0.32

            escala = 1 - indice * 0.035
            camada = 4 - indice

        } else if (indice === cartaoSelecionado) {
            // Cartão escolhido à esquerda
            x = largura * (celular ? 0.22 : 0.17)

            escala = 1
            camada = 10

        } else {
            // Os demais agrupados à direita
            const ordem = restantes.indexOf(indice)

            x = largura * (celular ? 0.62 : 0.77)
                + ordem * larguraCartao * 0.22

            escala = 0.9 - ordem * 0.035
            camada = 4 - ordem
        }

        botao.style.zIndex = camada

        botao.setAttribute(
            'aria-expanded',
            String(indice === cartaoSelecionado)
        )

        gsap.to(botao, {
            x,
            y: centroY,
            scale: escala,
            rotation: cartaoSelecionado === indice ? -4 : 4,
            duration: animar && !movimentoCartoes.matches ? 0.8 : 0,
            ease: 'power3.inOut',
            overwrite: true
        })
    })
}

opcoesCartoes.forEach((botao, indice) => {
    botao.addEventListener('click', () => {
        if (cartaoSelecionado === indice) return

        cartaoSelecionado = indice

        const dados = dadosCartoes[botao.dataset.cartao]
        detalhesCartao.dataset.cartao = botao.dataset.cartao

        nomeCartao.textContent = dados.nome
        descricaoCartao.textContent = dados.descricao
        detalhesCartao.hidden = false

        instrucaoCartoes.textContent =
            'Selecione outro cartão para comparar'

        posicionarCartoes()

        gsap.fromTo(
            detalhesCartao,
            { opacity: 0 },
            {
                opacity: 1,
                duration: movimentoCartoes.matches ? 0 : 0.45,
                delay: movimentoCartoes.matches ? 0 : 0.25,
                overwrite: true
            }
        )
    })
})

voltarCartoes.addEventListener('click', () => {
    const indiceAnterior = cartaoSelecionado

    cartaoSelecionado = null
    detalhesCartao.hidden = true

    instrucaoCartoes.textContent =
        'Escolha um cartão para conhecer'

    posicionarCartoes()

    if (indiceAnterior !== null) {
        opcoesCartoes[indiceAnterior].focus({ preventScroll: true })
    }
})

// Flutuação independente do movimento dos botões
const flutuacaoCartoes = gsap.matchMedia()

flutuacaoCartoes.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
        opcoesCartoes.forEach((botao, indice) => {
            gsap.to(botao.querySelector('img'), {
                y: -12,
                duration: 1.8,
                delay: indice * 0.35,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })
        })
    }
)

posicionarCartoes(false)

window.addEventListener('resize', () => {
    posicionarCartoes(false)
})