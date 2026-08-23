/**
 * DOOM (1993) - WebAssembly Controller & Input Bridge
 * Full Internationalization (chrome.i18n + Standalone Web / PWA fallback)
 */

// Modern Web Audio Scheduler Polyfill for SDL2/Emscripten
// Eliminates Chromium "ScriptProcessorNode is deprecated" warning in chrome://extensions
(function() {
  const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext && OrigAudioContext.prototype) {
    OrigAudioContext.prototype.createScriptProcessor = function(bufferSize, numInputChannels, numOutputChannels) {
      const ctx = this;
      const channels = numOutputChannels || 2;
      const size = bufferSize || 2048;
      
      let nextStartTime = 0;
      let timer = null;
      let onAudioProcessHandler = null;

      const outputGain = ctx.createGain();

      function scheduleAudio() {
        if (!onAudioProcessHandler) return;
        const now = ctx.currentTime;
        while (nextStartTime < now + 0.15) {
          if (nextStartTime < now) nextStartTime = now;
          const audioBuffer = ctx.createBuffer(channels, size, ctx.sampleRate);
          const evt = { outputBuffer: audioBuffer, inputBuffer: null, playbackTime: nextStartTime };
          try {
            onAudioProcessHandler(evt);
          } catch(e) {
            break;
          }
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(outputGain);
          src.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
        }
      }

      Object.defineProperty(outputGain, 'onaudioprocess', {
        get() { return onAudioProcessHandler; },
        set(fn) {
          onAudioProcessHandler = fn;
          if (fn && !timer) {
            nextStartTime = ctx.currentTime + 0.05;
            timer = setInterval(scheduleAudio, (size / ctx.sampleRate) * 500);
          } else if (!fn && timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      });

      const origDisconnect = outputGain.disconnect.bind(outputGain);
      outputGain.disconnect = function() {
        if (timer) { clearInterval(timer); timer = null; }
        return origDisconnect();
      };

      return outputGain;
    };
  }
})();

// --- 1. Multilingual Translations Dictionary ---
const TRANSLATIONS = {
  es: {
    extName: "DOOM (1993) Offline - Easter Egg Sin Internet",
    extDescription: "Juega al auténtico Doom clásico de 1993 cuando se corte el internet. Motor retro en WebAssembly 100% offline.",
    header_title: "DOOM (1993)",
    header_sub: "FPS RETRO CLÁSICO (1993)",
    toggle_touch: "Gamepad",
    controls: "Controles",
    load_wad: "WAD",
    status_online: "🟢 EN LÍNEA",
    status_offline: "🔴 SIN CONEXIÓN",
    start_prompt_title: "DOOM",
    start_prompt_desc: "DOOM1.WAD Shareware Oficial de id Software (1993)",
    start_prompt_btn: "▶ HAZ CLIC PARA JUGAR",
    start_prompt_hint: "Usa el teclado (WASD / Flechas / Espacio / Ctrl) o haz clic para apuntar con el mouse.",
    controls_title: "Controles Originales de DOOM (1993)",
    ctrl_move: "Avanzar / Retroceder",
    ctrl_move_keys: "W / S o ↑ / ↓",
    ctrl_turn: "Girar Izquierda / Derecha",
    ctrl_turn_keys: "A / D o ← / → (o Mouse)",
    ctrl_fire: "Disparar Arma",
    ctrl_fire_keys: "Ctrl Izquierdo o Clic Izquierdo",
    ctrl_use: "Abrir Puertas / Interruptor",
    ctrl_use_keys: "Barra Espaciadora o Enter",
    ctrl_run: "Correr / Velocidad",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "Seleccionar Armas (1 - 7)",
    ctrl_weapons_keys: "Teclas 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automapa",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Menú Principal de Doom",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Haz clic sobre el lienzo del juego para activar el apuntado con Mouse (Pointer Lock).",
    wad_modal_title: "Cargar WAD Personalizado / Mods",
    wad_drag_text: "Arrastra y suelta tu archivo .WAD aquí",
    wad_drag_sub: "Compatible con DOOM.WAD, DOOM2.WAD, TNT.WAD, PLUTONIA.WAD, SIGIL.WAD o PWADs.",
    restore_default_wad: "Restaurar DOOM1.WAD",
    browse_file: "Explorar Archivo",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  en: {
    extName: "DOOM (1993) Offline - No Internet Easter Egg",
    extDescription: "Play authentic classic Doom offline when internet dies. 100% offline WebAssembly retro FPS engine.",
    header_title: "DOOM (1993)",
    header_sub: "CLASSIC RETRO FPS (1993)",
    toggle_touch: "Gamepad",
    controls: "Controls",
    load_wad: "WAD",
    status_online: "🟢 ONLINE",
    status_offline: "🔴 OFFLINE",
    start_prompt_title: "DOOM",
    start_prompt_desc: "Official DOOM1.WAD Shareware by id Software (1993)",
    start_prompt_btn: "▶ CLICK TO PLAY",
    start_prompt_hint: "Use keyboard (WASD / Arrows / Space / Ctrl) or click to aim with mouse.",
    controls_title: "Original DOOM (1993) Controls",
    ctrl_move: "Move Forward / Backward",
    ctrl_move_keys: "W / S or ↑ / ↓",
    ctrl_turn: "Turn Left / Right",
    ctrl_turn_keys: "A / D or ← / → (or Mouse)",
    ctrl_fire: "Fire Weapon",
    ctrl_fire_keys: "Left Ctrl or Left Click",
    ctrl_use: "Open Doors / Switches",
    ctrl_use_keys: "Spacebar or Enter",
    ctrl_run: "Sprint / Run",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "Select Weapons (1 - 7)",
    ctrl_weapons_keys: "Keys 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automap",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Doom Main Menu",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Click on game canvas to enable Mouse Look (Pointer Lock).",
    wad_modal_title: "Load Custom WAD / Mods",
    wad_drag_text: "Drag & drop your .WAD file here",
    wad_drag_sub: "Supports DOOM.WAD, DOOM2.WAD, TNT.WAD, PLUTONIA.WAD, SIGIL.WAD, or PWADs.",
    restore_default_wad: "Reset to DOOM1.WAD",
    browse_file: "Browse File",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  pt_BR: {
    extName: "DOOM (1993) Offline - Easter Egg Sem Internet",
    extDescription: "Jogue o autêntico Doom clássico de 1993 quando a internet cair. Motor retro WebAssembly 100% offline.",
    header_title: "DOOM (1993)",
    header_sub: "FPS RETRO CLÁSSICO (1993)",
    toggle_touch: "Gamepad",
    controls: "Controles",
    load_wad: "WAD",
    status_online: "🟢 ONLINE",
    status_offline: "🔴 OFFLINE",
    start_prompt_title: "DOOM",
    start_prompt_desc: "DOOM1.WAD Shareware Oficial da id Software (1993)",
    start_prompt_btn: "▶ CLIQUE PARA JOGAR",
    start_prompt_hint: "Use o teclado (WASD / Setas / Espaço / Ctrl) ou clique para mirar com o mouse.",
    controls_title: "Controles Originais do DOOM (1993)",
    ctrl_move: "Avançar / Recuar",
    ctrl_move_keys: "W / S ou ↑ / ↓",
    ctrl_turn: "Girar Esquerda / Direita",
    ctrl_turn_keys: "A / D ou ← / → (ou Mouse)",
    ctrl_fire: "Disparar Arma",
    ctrl_fire_keys: "Ctrl Esquerdo ou Clique Esquerdo",
    ctrl_use: "Abrir Portas / Interruptores",
    ctrl_use_keys: "Barra de Espaço ou Enter",
    ctrl_run: "Correr / Velocidade",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "Selecionar Armas (1 - 7)",
    ctrl_weapons_keys: "Teclas 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automapa",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Menu Principal do Doom",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Clique na tela do jogo para ativar a mira com mouse.",
    wad_modal_title: "Carregar WAD Personalizado / Mods",
    wad_drag_text: "Arraste e solte seu arquivo .WAD aqui",
    wad_drag_sub: "Compatível com DOOM.WAD, DOOM2.WAD, TNT.WAD, PLUTONIA.WAD, SIGIL.WAD ou PWADs.",
    restore_default_wad: "Restaurar DOOM1.WAD",
    browse_file: "Procurar Arquivo",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  fr: {
    extName: "DOOM (1993) Offline - Easter Egg Sans Internet",
    extDescription: "Jouez à l'authentique Doom classique de 1993 hors ligne. Moteur FPS rétro WebAssembly 100% hors ligne.",
    header_title: "DOOM (1993)",
    header_sub: "FPS RÉTRO CLASSIQUE (1993)",
    toggle_touch: "Gamepad",
    controls: "Commandes",
    load_wad: "WAD",
    status_online: "🟢 EN LIGNE",
    status_offline: "🔴 HORS LIGNE",
    start_prompt_title: "DOOM",
    start_prompt_desc: "DOOM1.WAD Shareware Officiel par id Software (1993)",
    start_prompt_btn: "▶ CLIQUER POUR JOUER",
    start_prompt_hint: "Utilisez le clavier (WASD / Flèches / Espace / Ctrl) ou cliquez pour viser à la souris.",
    controls_title: "Commandes d'origine de DOOM (1993)",
    ctrl_move: "Avancer / Reculer",
    ctrl_move_keys: "Z / S ou ↑ / ↓",
    ctrl_turn: "Tourner Gauche / Droite",
    ctrl_turn_keys: "Q / D ou ← / → (ou Souris)",
    ctrl_fire: "Tirer",
    ctrl_fire_keys: "Ctrl Gauche ou Clic Gauche",
    ctrl_use: "Ouvrir Portes / Actionner",
    ctrl_use_keys: "Espace ou Entrée",
    ctrl_run: "Courir / Vitesse",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "Sélectionner Armes (1 - 7)",
    ctrl_weapons_keys: "Touches 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automap",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Menu Principal Doom",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Cliquez sur le jeu pour verrouiller la souris et viser.",
    wad_modal_title: "Charger un WAD Personnalisé / Mods",
    wad_drag_text: "Glissez et déposez votre fichier .WAD ici",
    wad_drag_sub: "Prend en charge DOOM.WAD, DOOM2.WAD, TNT.WAD, SIGIL.WAD ou PWADs.",
    restore_default_wad: "Réinitialiser DOOM1.WAD",
    browse_file: "Parcourir",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  de: {
    extName: "DOOM (1993) Offline - Kein Internet Easter Egg",
    extDescription: "Spiele authentisches klassisches Doom offline wenn das Internet ausfällt. 100% Offline WebAssembly Retro FPS.",
    header_title: "DOOM (1993)",
    header_sub: "KLASSISCHER RETRO FPS (1993)",
    toggle_touch: "Gamepad",
    controls: "Steuerung",
    load_wad: "WAD",
    status_online: "🟢 ONLINE",
    status_offline: "🔴 OFFLINE",
    start_prompt_title: "DOOM",
    start_prompt_desc: "Offizielles DOOM1.WAD Shareware von id Software (1993)",
    start_prompt_btn: "▶ KLICKEN ZUM SPIELEN",
    start_prompt_hint: "Verwende Tastatur (WASD / Pfeiltasten / Leertaste / Strg) oder Maus.",
    controls_title: "Originale DOOM (1993) Steuerung",
    ctrl_move: "Vorwärts / Rückwärts",
    ctrl_move_keys: "W / S oder ↑ / ↓",
    ctrl_turn: "Links / Rechts drehen",
    ctrl_turn_keys: "A / D oder ← / → (oder Maus)",
    ctrl_fire: "Waffe abfeuern",
    ctrl_fire_keys: "Linke Strg oder Linksklick",
    ctrl_use: "Türen / Schalter betätigen",
    ctrl_use_keys: "Leertaste oder Enter",
    ctrl_run: "Sprinten / Laufen",
    ctrl_run_keys: "Umschalttaste (Shift)",
    ctrl_weapons: "Waffen wählen (1 - 7)",
    ctrl_weapons_keys: "Tasten 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automap",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Hauptmenü",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Klicke auf die Spielfläche für die Maussteuerung.",
    wad_modal_title: "Eigenes WAD / Mods laden",
    wad_drag_text: ".WAD-Datei hier hineinziehen",
    wad_drag_sub: "Unterstützt DOOM.WAD, DOOM2.WAD, TNT.WAD, SIGIL.WAD und PWADs.",
    restore_default_wad: "Auf DOOM1.WAD zurücksetzen",
    browse_file: "Datei auswählen",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  it: {
    extName: "DOOM (1993) Offline - Easter Egg Senza Internet",
    extDescription: "Gioca all'autentico Doom classico del 1993 offline. Motore FPS retrò in WebAssembly 100% offline.",
    header_title: "DOOM (1993)",
    header_sub: "FPS RETRÒ CLASSICO (1993)",
    toggle_touch: "Gamepad",
    controls: "Comandi",
    load_wad: "WAD",
    status_online: "🟢 ONLINE",
    status_offline: "🔴 OFFLINE",
    start_prompt_title: "DOOM",
    start_prompt_desc: "DOOM1.WAD Shareware Ufficiale di id Software (1993)",
    start_prompt_btn: "▶ CLICCA PER GIOCARE",
    start_prompt_hint: "Usa la tastiera (WASD / Frecce / Spazio / Ctrl) o il mouse.",
    controls_title: "Comandi Originali di DOOM (1993)",
    ctrl_move: "Avanti / Indietro",
    ctrl_move_keys: "W / S o ↑ / ↓",
    ctrl_turn: "Gira a Sinistra / Destra",
    ctrl_turn_keys: "A / D o ← / → (o Mouse)",
    ctrl_fire: "Spara con l'arma",
    ctrl_fire_keys: "Ctrl Sinistro o Clic Sinistro",
    ctrl_use: "Apri Porte / Interruttori",
    ctrl_use_keys: "Barra Spaziatrice o Invio",
    ctrl_run: "Corri / Velocità",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "Seleziona Armi (1 - 7)",
    ctrl_weapons_keys: "Tasti 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "Automappa",
    ctrl_map_keys: "Tab",
    ctrl_menu: "Menu Principale Doom",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 Clicca sul canvas per attivare il puntamento col mouse.",
    wad_modal_title: "Carica WAD Personalizzato / Mod",
    wad_drag_text: "Trascina qui il tuo file .WAD",
    wad_drag_sub: "Supporta DOOM.WAD, DOOM2.WAD, TNT.WAD, SIGIL.WAD o PWAD.",
    restore_default_wad: "Ripristina DOOM1.WAD",
    browse_file: "Sfoglia File",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  ja: {
    extName: "DOOM (1993) オフライン - 接続切断イースターエッグ",
    extDescription: "ネット切断時も1993年伝説のDOOMをプレイ！WebAssembly搭載の完全オフラインFPS。",
    header_title: "DOOM (1993)",
    header_sub: "クラシック レトロFPS (1993)",
    toggle_touch: "Gamepad",
    controls: "操作方法",
    load_wad: "WAD",
    status_online: "🟢 オンライン",
    status_offline: "🔴 オフライン",
    start_prompt_title: "DOOM",
    start_prompt_desc: "id Software公式 DOOM1.WAD シェアウェア (1993)",
    start_prompt_btn: "▶ クリックしてプレイ",
    start_prompt_hint: "キーボード（WASD / 矢印 / スペース / Ctrl）またはマウスで操作。",
    controls_title: "DOOM (1993) 原作操作キー",
    ctrl_move: "前進 / 後退",
    ctrl_move_keys: "W / S または ↑ / ↓",
    ctrl_turn: "左 / 右旋回",
    ctrl_turn_keys: "A / D または ← / → (マウス)",
    ctrl_fire: "武器発射",
    ctrl_fire_keys: "左Ctrl または 左クリック",
    ctrl_use: "ドアを開く / スイッチ",
    ctrl_use_keys: "スペース または Enter",
    ctrl_run: "ダッシュ / 走る",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "武器切り替え (1 - 7)",
    ctrl_weapons_keys: "数字キー 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "オートマップ",
    ctrl_map_keys: "Tab",
    ctrl_menu: "メインメニュー",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 ゲーム画面をクリックするとマウス視点操作が有効になります。",
    wad_modal_title: "カスタムWAD / MOD読込",
    wad_drag_text: ".WADファイルをここにドラッグ＆ドロップ",
    wad_drag_sub: "DOOM.WAD, DOOM2.WAD, TNT.WAD, SIGIL.WAD, 各種MOD対応。",
    restore_default_wad: "DOOM1.WADに戻す",
    browse_file: "ファイル選択",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  ko: {
    extName: "DOOM (1993) 오프라인 - 인터넷 끊김 이스터에그",
    extDescription: "인터넷이 끊겨도 플레이 가능한 1993년 오리지널 클래식 DOOM! 100% 오프라인 WebAssembly FPS.",
    header_title: "DOOM (1993)",
    header_sub: "클래식 레트로 FPS (1993)",
    toggle_touch: "Gamepad",
    controls: "조작법",
    load_wad: "WAD",
    status_online: "🟢 온라인",
    status_offline: "🔴 오프라인",
    start_prompt_title: "DOOM",
    start_prompt_desc: "id Software 공식 DOOM1.WAD 셰어웨어 (1993)",
    start_prompt_btn: "▶ 클릭하여 게임 시작",
    start_prompt_hint: "키보드(WASD / 방향키 / 스페이스바 / Ctrl) 또는 마우스로 조작하세요.",
    controls_title: "오리지널 DOOM (1993) 조작법",
    ctrl_move: "전진 / 후진",
    ctrl_move_keys: "W / S 또는 ↑ / ↓",
    ctrl_turn: "좌 / 우 회전",
    ctrl_turn_keys: "A / D 또는 ← / → (마우스)",
    ctrl_fire: "무기 발사",
    ctrl_fire_keys: "왼쪽 Ctrl 또는 좌클릭",
    ctrl_use: "문 열기 / 스위치",
    ctrl_use_keys: "스페이스바 또는 Enter",
    ctrl_run: "달리기 / 질주",
    ctrl_run_keys: "Shift",
    ctrl_weapons: "무기 선택 (1 - 7)",
    ctrl_weapons_keys: "숫자키 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "자동 지도",
    ctrl_map_keys: "Tab",
    ctrl_menu: "메인 메뉴",
    ctrl_menu_keys: "Esc",
    mouse_tip: "💡 게임 화면을 클릭하면 마우스 조준(포인터 락)이 활성화됩니다.",
    wad_modal_title: "커스텀 WAD / 모드 로드",
    wad_drag_text: ".WAD 파일을 여기에 드래그 앤 드롭하세요",
    wad_drag_sub: "DOOM.WAD, DOOM2.WAD, TNT.WAD, SIGIL.WAD 및 커뮤니티 모드 지원.",
    restore_default_wad: "DOOM1.WAD로 초기화",
    browse_file: "파일 찾기",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  },
  zh_CN: {
    extName: "DOOM (1993) 离线版 - 断网彩蛋游戏",
    extDescription: "断网时畅玩1993年经典原版DOOM毁灭战士！基于WebAssembly的100%纯离线复古FPS引擎。",
    header_title: "DOOM (1993)",
    header_sub: "经典复古FPS (1993)",
    toggle_touch: "Gamepad",
    controls: "按键操作",
    load_wad: "WAD",
    status_online: "🟢 在线",
    status_offline: "🔴 离线",
    start_prompt_title: "DOOM",
    start_prompt_desc: "id Software 官方 DOOM1.WAD 共享版 (1993)",
    start_prompt_btn: "▶ 点击开始游戏",
    start_prompt_hint: "使用键盘（WASD / 方向键 / 空格 / Ctrl）或点击鼠标锁定视角。",
    controls_title: "DOOM (1993) 原版键位指南",
    ctrl_move: "前进 / 后退",
    ctrl_move_keys: "W / S 或 ↑ / ↓",
    ctrl_turn: "左转 / 右转",
    ctrl_turn_keys: "A / D 或 ← / → (或鼠标)",
    ctrl_fire: "开火射击",
    ctrl_fire_keys: "左 Ctrl 或 鼠标左键",
    ctrl_use: "开门 / 触发开关",
    ctrl_use_keys: "空格键 或 回车键",
    ctrl_run: "加速奔跑",
    ctrl_run_keys: "Shift 键",
    ctrl_weapons: "切换武器 (1 - 7)",
    ctrl_weapons_keys: "数字键 1, 2, 3, 4, 5, 6, 7",
    ctrl_map: "自动地图",
    ctrl_map_keys: "Tab 键",
    ctrl_menu: "Doom 主菜单",
    ctrl_menu_keys: "Esc 键",
    mouse_tip: "💡 点击游戏画面可锁定鼠标进行视角转动。",
    wad_modal_title: "加载自定义WAD / 模组",
    wad_drag_text: "将 .WAD 文件拖拽至此处",
    wad_drag_sub: "支持 DOOM.WAD、DOOM2.WAD、TNT.WAD、SIGIL.WAD 及社区各类PWAD模组。",
    restore_default_wad: "恢复默认 DOOM1.WAD",
    browse_file: "浏览文件",
    touch_map: "MAP",
    touch_esc: "ESC",
    touch_run: "RUN",
    touch_use: "USE",
    touch_fire: "FIRE"
  }
};

// Suppress mobile PWA install banners to preserve the pure browser easter-egg feel
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  return false;
});

// Auto-detect best locale
function detectInitialLocale() {
  const saved = localStorage.getItem("doomed_lang");
  if (saved && TRANSLATIONS[saved]) return saved;

  const browserLang = (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage)
    ? chrome.i18n.getUILanguage()
    : navigator.language || "es";

  const cleanLang = browserLang.replace("-", "_");
  if (TRANSLATIONS[cleanLang]) return cleanLang;
  
  const prefix = cleanLang.split("_")[0];
  if (prefix === "pt") return "pt_BR";
  if (prefix === "zh") return "zh_CN";
  if (TRANSLATIONS[prefix]) return prefix;

  return "es";
}

// State
let wasEverOffline = !navigator.onLine;
let currentLang = detectInitialLocale();
let customWadFile = null;
let customWadBuffer = null;
let engineStarted = false;
let touchGamepadVisible = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Elements
const dinoLanding = document.getElementById("dinoLanding");
const btnDinoPlay = document.getElementById("btnDinoPlay");
const chkNotifyOnline = document.getElementById("chkNotifyOnline");
const onlineAlertModal = document.getElementById("onlineAlertModal");
const btnStayInGame = document.getElementById("btnStayInGame");
const btnReturnToSearch = document.getElementById("btnReturnToSearch");
const langSelect = document.getElementById("langSelect");
const connectionBadge = document.getElementById("connectionBadge");
const startPrompt = document.getElementById("startPrompt");
const btnStartPrompt = document.getElementById("btnStartPrompt");
const btnToggleTouch = document.getElementById("btnToggleTouch");
const touchController = document.getElementById("touchController");
const btnControls = document.getElementById("btnControls");
const btnCloseControls = document.getElementById("btnCloseControls");
const controlsModal = document.getElementById("controlsModal");
const btnLoadWad = document.getElementById("btnLoadWad");
const btnCloseWad = document.getElementById("btnCloseWad");
const wadModal = document.getElementById("wadModal");
const dropTarget = document.getElementById("dropTarget");
const wadFileInput = document.getElementById("wadFileInput");
const btnBrowseFile = document.getElementById("btnBrowseFile");
const btnResetDefaultWad = document.getElementById("btnResetDefaultWad");
const canvas = document.getElementById("canvas");

// Store native fullscreen API before any overrides
const nativeRequestFullscreen = (
  document.documentElement.requestFullscreen ||
  document.documentElement.webkitRequestFullscreen ||
  document.documentElement.mozRequestFullScreen ||
  document.documentElement.msRequestFullscreen
)?.bind(document.documentElement);

function requestMobileFullscreen() {
  const isMobile = /Mobi|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent);
  if (!isMobile) return;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape && !document.fullscreenElement && nativeRequestFullscreen) {
    nativeRequestFullscreen().catch(() => {});
  }
}

window.addEventListener("orientationchange", () => setTimeout(requestMobileFullscreen, 350));
if (screen.orientation) {
  screen.orientation.addEventListener("change", () => setTimeout(requestMobileFullscreen, 350));
}

// Parse redirected original URL if intercepted from lost connection
const urlParams = new URLSearchParams(window.location.search);
const originalFromUrl = urlParams.get("from");

// --- 2. Internationalization (chrome.i18n + Standalone fallback) ---
function getI18nText(key) {
  if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
    const msg = chrome.i18n.getMessage(key);
    if (msg) return msg;
  }
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
  return dict[key] || TRANSLATIONS.es[key] || "";
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) lang = "es";
  currentLang = lang;
  localStorage.setItem("doomed_lang", lang);
  if (langSelect) langSelect.value = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : getI18nText(key);
    if (val) {
      el.textContent = val;
    }
  });
  updateNetworkStatus(false);
}

if (langSelect) {
  langSelect.addEventListener("change", (e) => setLanguage(e.target.value));
}
setLanguage(currentLang);

// --- 3. Connection Status & Online Auto-Pause Recovery ---
function updateNetworkStatus(triggerAlert = true, isOnlineExplicit = null) {
  const isOnline = (isOnlineExplicit !== null) ? isOnlineExplicit : navigator.onLine;
  if (connectionBadge) {
    if (isOnline) {
      connectionBadge.className = "nav-badge online";
      connectionBadge.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].status_online) || "🟢 EN LÍNEA";
    } else {
      wasEverOffline = true;
      connectionBadge.className = "nav-badge offline";
      connectionBadge.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].status_offline) || "🔴 SIN CONEXIÓN";
    }
  }

  // If connection is restored and user chose to be notified:
  if (isOnline && wasEverOffline && triggerAlert) {
    const shouldNotify = chkNotifyOnline ? chkNotifyOnline.checked : true;
    if (shouldNotify) {
      console.log("[Doomed] Internet connection restored! Pausing game and showing notification...");
      
      // Pause DOOM with Escape key if running
      if (engineStarted) {
        dispatchKey("Escape", "keydown");
        setTimeout(() => dispatchKey("Escape", "keyup"), 100);
      }

      // Show Connection Restored Modal
      if (onlineAlertModal) {
        onlineAlertModal.classList.remove("hidden");
      }
    }
  }
}

window.addEventListener("online", () => updateNetworkStatus(true, true));
window.addEventListener("offline", () => updateNetworkStatus(false, false));
updateNetworkStatus(false);

// Return to search or original page handler
if (btnReturnToSearch) {
  btnReturnToSearch.addEventListener("click", () => {
    if (originalFromUrl) {
      window.location.href = decodeURIComponent(originalFromUrl);
    } else {
      window.location.href = "https://www.google.com";
    }
  });
}

if (btnStayInGame) {
  btnStayInGame.addEventListener("click", () => {
    if (onlineAlertModal) {
      onlineAlertModal.classList.add("hidden");
    }
    if (canvas) canvas.focus();
  });
}

// --- 4. Touch Controller Toggle ---
function updateTouchGamepad() {
  if (touchController) {
    if (touchGamepadVisible) {
      touchController.classList.remove("hidden-touch");
    } else {
      touchController.classList.add("hidden-touch");
    }
  }
}
updateTouchGamepad();

if (btnToggleTouch) {
  btnToggleTouch.addEventListener("click", () => {
    touchGamepadVisible = !touchGamepadVisible;
    updateTouchGamepad();
  });
}

// --- 5. Modals & Navigation ---
if (btnControls) btnControls.addEventListener("click", () => controlsModal && controlsModal.classList.remove("hidden"));
if (btnCloseControls) btnCloseControls.addEventListener("click", () => controlsModal && controlsModal.classList.add("hidden"));

if (btnLoadWad) btnLoadWad.addEventListener("click", () => wadModal && wadModal.classList.remove("hidden"));
if (btnCloseWad) btnCloseWad.addEventListener("click", () => wadModal && wadModal.classList.add("hidden"));

// --- 6. Custom WAD Handling ---
if (btnBrowseFile && wadFileInput) btnBrowseFile.addEventListener("click", () => wadFileInput.click());
if (dropTarget && wadFileInput) dropTarget.addEventListener("click", () => wadFileInput.click());

if (dropTarget) {
  dropTarget.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropTarget.classList.add("active");
  });
  dropTarget.addEventListener("dragleave", () => dropTarget.classList.remove("active"));
  dropTarget.addEventListener("drop", (e) => {
    e.preventDefault();
    dropTarget.classList.remove("active");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleWadSelected(e.dataTransfer.files[0]);
    }
  });
}

if (wadFileInput) {
  wadFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleWadSelected(e.target.files[0]);
    }
  });
}

async function handleWadSelected(file) {
  if (!file.name.toLowerCase().endsWith(".wad")) {
    alert("¡Por favor selecciona un archivo .wad válido!");
    return;
  }
  customWadFile = file;
  customWadBuffer = new Uint8Array(await file.arrayBuffer());
  if (wadModal) wadModal.classList.add("hidden");
  alert(`WAD "${file.name}" cargado. Reiniciando juego...`);
  location.reload();
}

if (btnResetDefaultWad) {
  btnResetDefaultWad.addEventListener("click", () => {
    customWadFile = null;
    customWadBuffer = null;
    if (wadModal) wadModal.classList.add("hidden");
    location.reload();
  });
}

// Block any native fullscreen triggers from browser/SDL to keep the game in-window
try {
  Element.prototype.requestFullscreen = function() { return Promise.resolve(); };
  document.documentElement.requestFullscreen = function() { return Promise.resolve(); };
  if (document.body) {
    document.body.requestFullscreen = function() { return Promise.resolve(); };
  }
} catch (e) {}

// Enforce DOOM native 16:10 (320×200) aspect ratio in portrait mode
function enforceNativeCanvas() {
  const isPortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
  const vp = document.querySelector("main.game-viewport");
  if (isPortrait) {
    const w = window.innerWidth;
    const h = Math.round(w * 0.625); // 16:10 = height is 62.5% of width
    if (vp) {
      vp.style.setProperty("width", `${w}px`, "important");
      vp.style.setProperty("max-width", `${w}px`, "important");
      vp.style.setProperty("min-width", `${w}px`, "important");
      vp.style.setProperty("height", `${h}px`, "important");
      vp.style.setProperty("max-height", `${h}px`, "important");
      vp.style.setProperty("min-height", `${h}px`, "important");
      vp.style.setProperty("aspect-ratio", "16 / 10", "important");
      vp.style.setProperty("margin", "0", "important");
      vp.style.setProperty("padding", "0", "important");
    }
    if (canvas) {
      canvas.style.setProperty("width", `${w}px`, "important");
      canvas.style.setProperty("height", `${h}px`, "important");
      canvas.style.setProperty("max-width", `${w}px`, "important");
      canvas.style.setProperty("max-height", `${h}px`, "important");
      canvas.style.setProperty("min-width", `${w}px`, "important");
      canvas.style.setProperty("min-height", `${h}px`, "important");
      canvas.style.setProperty("object-fit", "fill", "important");
      canvas.style.setProperty("margin", "0", "important");
      canvas.style.setProperty("padding", "0", "important");
    }
  } else if (vp && canvas) {
    vp.style.removeProperty("width");
    vp.style.removeProperty("max-width");
    vp.style.removeProperty("min-width");
    vp.style.removeProperty("height");
    vp.style.removeProperty("max-height");
    vp.style.removeProperty("min-height");
    vp.style.removeProperty("aspect-ratio");
    vp.style.removeProperty("margin");
    vp.style.removeProperty("padding");
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
    canvas.style.removeProperty("max-width");
    canvas.style.removeProperty("max-height");
    canvas.style.removeProperty("min-width");
    canvas.style.removeProperty("min-height");
    canvas.style.removeProperty("object-fit");
    canvas.style.removeProperty("margin");
    canvas.style.removeProperty("padding");
  }
}

window.addEventListener("resize", enforceNativeCanvas);
window.addEventListener("orientationchange", () => setTimeout(enforceNativeCanvas, 150));
document.addEventListener("DOMContentLoaded", enforceNativeCanvas);
setInterval(enforceNativeCanvas, 250);

// --- 7. Engine Lifecycle ---
function startDoom() {
  if (engineStarted) return;
  engineStarted = true;
  if (dinoLanding) dinoLanding.classList.add("hidden");
  if (touchController && /Mobi|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent)) {
    touchController.classList.remove("hidden-touch");
  }
  enforceNativeCanvas();
  requestMobileFullscreen();
  if (canvas) canvas.focus();

  const wadName = customWadFile ? customWadFile.name.toLowerCase() : "doom1.wad";

  window.Module = {
    canvas: canvas,
    arguments: ["-iwad", wadName],
    requestFullscreen: function() { return 0; },
    locateFile: function (path) {
      return "engine/" + path;
    },
    preRun: [function () {
      enforceNativeCanvas();
      if (customWadFile && customWadBuffer) {
        try {
          window.Module.FS.writeFile(wadName, customWadBuffer);
          console.log(`Injected custom WAD: ${wadName}`);
        } catch (err) {
          console.error("Failed to write WAD to virtual FS:", err);
        }
      }
    }],
    postRun: [function () {
      console.log("DOOM (1993) WebAssembly Engine initialized!");
      enforceNativeCanvas();
      if (canvas) canvas.focus();
    }],
    print: function (text) {
      console.log("[DOOM]", text);
    },
    printErr: function (text) {
      console.error("[DOOM ERR]", text);
    }
  };

  const script = document.createElement("script");
  script.src = "engine/chocolate-doom.js";
  script.async = true;
  document.body.appendChild(script);
}

if (btnDinoPlay) {
  btnDinoPlay.addEventListener("click", startDoom);
}

// Auto-start on any keypress or click
window.addEventListener("keydown", (e) => {
  if (!engineStarted && (e.key === "Enter" || e.key === " " || e.key === "Control")) {
    startDoom();
  }
}, { once: true });

// --- 8. Mouse Pointer Lock ---
if (canvas) {
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  });
}

// --- 9. Virtual Key Dispatcher ---
const KEY_MAP = {
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38, which: 38 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40, which: 40 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37, which: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39, which: 39 },
  Enter: { key: "Enter", code: "Enter", keyCode: 13, which: 13 },
  Space: { key: " ", code: "Space", keyCode: 32, which: 32 },
  ControlLeft: { key: "Control", code: "ControlLeft", keyCode: 17, which: 17 },
  ShiftLeft: { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 },
  Tab: { key: "Tab", code: "Tab", keyCode: 9, which: 9 },
  Escape: { key: "Escape", code: "Escape", keyCode: 27, which: 27 },
  Digit1: { key: "1", code: "Digit1", keyCode: 49, which: 49 },
  Digit2: { key: "2", code: "Digit2", keyCode: 50, which: 50 },
  Digit3: { key: "3", code: "Digit3", keyCode: 51, which: 51 },
  Digit4: { key: "4", code: "Digit4", keyCode: 52, which: 52 },
  Digit5: { key: "5", code: "Digit5", keyCode: 53, which: 53 },
  Digit6: { key: "6", code: "Digit6", keyCode: 54, which: 54 },
  Digit7: { key: "7", code: "Digit7", keyCode: 55, which: 55 }
};

function dispatchKey(keyName, type) {
  const def = KEY_MAP[keyName];
  if (!def) return;

  const evInit = {
    key: def.key,
    code: def.code,
    keyCode: def.keyCode,
    which: def.which,
    charCode: def.keyCode,
    bubbles: true,
    cancelable: true,
    composed: true
  };

  const event = new KeyboardEvent(type, evInit);
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  if (canvas) {
    canvas.dispatchEvent(event);
  }
}

document.querySelectorAll(".t-btn").forEach(btn => {
  const key = btn.getAttribute("data-key");
  if (!key) return;

  const triggerPress = (e) => {
    e.preventDefault();
    btn.classList.add("pressed");
    dispatchKey(key, "keydown");
  };

  const triggerRelease = (e) => {
    e.preventDefault();
    btn.classList.remove("pressed");
    dispatchKey(key, "keyup");
  };

  btn.addEventListener("touchstart", triggerPress, { passive: false });
  btn.addEventListener("touchend", triggerRelease, { passive: false });
  btn.addEventListener("touchcancel", triggerRelease, { passive: false });
  btn.addEventListener("mousedown", triggerPress);
  btn.addEventListener("mouseup", triggerRelease);
  btn.addEventListener("mouseleave", triggerRelease);
});

// --- 10. Service Worker Registration (Web/PWA only, not chrome-extension scheme) ---
if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(reg => {
        console.log("DOOM Service Worker registered!", reg.scope);
        reg.update().catch(() => {});
      })
      .catch(err => console.error("SW failed:", err));
  });
}

