import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
