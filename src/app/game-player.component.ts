import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from './services/socket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-screen bg-slate-900 flex flex-col font-sans overflow-hidden select-none">

      <!-- Header -->
      <div class="bg-slate-800/80 backdrop-blur p-4 flex justify-between items-center shadow-md z-10">
        <div class="flex items-center gap-2">
           <span class="text-2xl bg-white/10 w-10 h-10 flex items-center justify-center rounded-full">👤</span>
           <div class="text-white font-bold text-lg max-w-[150px] truncate">{{ myName }}</div>
        </div>
        <div class="flex items-center gap-2">
           <span class="text-2xl bg-white/10 w-10 h-10 flex items-center justify-center rounded-full">🏠</span>
           <div class="text-white font-bold text-lg max-w-[150px] truncate" (click)="goToHome()">Inicio</div>
        </div>
        <div class="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-mono text-sm font-bold border border-indigo-500/30">
          EN VIVO
        </div>
      </div>

      <!-- LÓGICA DE ESTADOS CON @if -->

      
      @if (status === 'WAITING') {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
          <p>El juego aun no ha iniciado, espera a que el organizador lo inicie.. <br/>
          Revisa que no estes en el juego equivocado.</p>
        </div>
      }
      
      @if (status === 'RESULT' || status === 'FINISHED') {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
          @if (status === 'FINISHED') {
             <div class="text-7xl mb-6">🏁</div>
             <h2 class="text-3xl text-white font-bold mb-2">Juego Terminado</h2>
             <p class="text-slate-400 mb-4">{{ resultMessage }}</p>
          } @else {
             <div class="text-7xl mb-6">👀</div>
             <h2 class="text-2xl text-white font-bold mb-2">Mira la pantalla</h2>
             <p class="text-slate-400">
                @if (status === 'RESULT') {
                  <span class="text-yellow-400 font-bold block mb-2 text-xl">{{ resultMessage }}</span>
                }
                Esperando indicaciones del organizador...
             </p>
          }
        </div>
      }

      <!-- 2. ENVIADO -->
      @if (status === 'ANSWER_SENT') {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
          <div class="text-7xl mb-6 animate-bounce">🚀</div>
          <h2 class="text-3xl text-white font-bold mb-2">¡Enviado!</h2>
          <p class="text-slate-400">Ahora cruza los dedos...</p>
        </div>
      }

      <!-- 3. PREGUNTA ACTIVA (BOTONES) -->
      @if (status === 'QUESTION') {
        <div class="flex-1 flex flex-col p-4 pb-8 h-full">
          
          <!-- Pregunta Texto -->
          @if (currentQuestionText) {
            <div class="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
                <h2 class="text-xl text-white font-bold text-center">{{ currentQuestionText }}</h2>
            </div>
          }

          <div class="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pb-4">
            <!-- Rojo -->
            <button (click)="submitAnswer(0)" class="active:scale-95 transition-transform bg-red-600 rounded-2xl shadow-[0_4px_0_rgb(153,27,27)] flex items-center justify-start p-4 min-h-[80px]">
                <span class="text-white text-3xl drop-shadow-md mr-4 shrink-0">▲</span>
                <span class="text-white text-lg font-bold text-left leading-tight break-words">{{ currentOptions[0] }}</span>
            </button>

            <!-- Azul -->
            <button (click)="submitAnswer(1)" class="active:scale-95 transition-transform bg-blue-600 rounded-2xl shadow-[0_4px_0_rgb(30,58,138)] flex items-center justify-start p-4 min-h-[80px]">
                <span class="text-white text-3xl drop-shadow-md mr-4 shrink-0">◆</span>
                <span class="text-white text-lg font-bold text-left leading-tight break-words">{{ currentOptions[1] }}</span>
            </button>

            <!-- Amarillo -->
            <button (click)="submitAnswer(2)" class="active:scale-95 transition-transform bg-yellow-500 rounded-2xl shadow-[0_4px_0_rgb(161,98,7)] flex items-center justify-start p-4 min-h-[80px]">
                <span class="text-white text-3xl drop-shadow-md mr-4 shrink-0">●</span>
                <span class="text-white text-lg font-bold text-left leading-tight break-words">{{ currentOptions[2] }}</span>
            </button>

            <!-- Verde -->
            <button (click)="submitAnswer(3)" class="active:scale-95 transition-transform bg-green-600 rounded-2xl shadow-[0_4px_0_rgb(21,128,61)] flex items-center justify-start p-4 min-h-[80px]">
                <span class="text-white text-3xl drop-shadow-md mr-4 shrink-0">■</span>
                <span class="text-white text-lg font-bold text-left leading-tight break-words">{{ currentOptions[3] }}</span>
            </button>
          </div>
        </div>
      }

    </div>
  `
})
export class GamePlayerComponent implements OnInit {
  private socketService = inject(SocketService);
  private router = inject(Router);
  status: 'WAITING' | 'QUESTION' | 'ANSWER_SENT' | 'RESULT' | 'FINISHED' = 'WAITING';
  myName: string = '';
  resultMessage: string = '';
  gameId: string | null = null;
  currentQuestionText: string = '';
  currentOptions: string[] = [];
  finSorteo: boolean = false;

  constructor() {
    this.myName = localStorage.getItem('player_name') || 'Jugador';
  }

  ngOnInit() {
    // Obtener gameId de la ruta
    const gameId = localStorage.getItem('game_id');
    if (!gameId) {
      this.router.navigate(['/games']);
      return;
    }
    this.gameId = gameId;

    // 1. Nueva pregunta inicia -> Mostrar botones
    this.socketService.fromEvent<any>('NEW_QUESTION').subscribe((q) => {
      this.status = 'QUESTION';
      this.resultMessage = '';
      this.currentQuestionText = q.t; // Guardar texto de la pregunta
      this.currentOptions = q.options || []; // Guardar opciones

      if (navigator.vibrate) navigator.vibrate(200);
    });

    // Escuchar actualizaciones de estado general (WAITING, FINISHED)
    this.socketService.fromEvent<any>('GAME_STATUS').subscribe((st) => {
      if (st.status === 'FINISHED') {
        this.status = 'FINISHED';
        if (!this.resultMessage) {
          this.resultMessage = "Gracias por participar.";
        }
      } else if (st.status === 'WAITING') {
        this.status = 'WAITING';
      }
    });

    // 2. Confirmación de que el server recibió mi clic -> Mostrar cohete
    this.socketService.fromEvent('ANSWER_RECEIVED').subscribe(() => {
      this.status = 'ANSWER_SENT';
    });

    // 3. Resultados llegaron -> Volver a esperar
    this.socketService.fromEvent<any>('ROUND_RESULTS').subscribe((res) => {
      this.status = 'RESULT';

      const myId = this.socketService.socketId;
      const myPlayerId = localStorage.getItem('player_id');

      const amIWinner = res.roundWinners.some((w: any) =>
        w.id === myId || (myPlayerId && w.playerId === myPlayerId)
      );

      if (amIWinner) {
        this.resultMessage = "¡GANASTE! VE POR TU PREMIO 🎁";
      } else {
        this.resultMessage = "¡Ronda finalizada!";
      }

      this.currentQuestionText = '';


    });

    // 4. Resultados de Lottery
    this.socketService.fromEvent<any>('LOTTERY_RESULTS').subscribe((res) => {
      this.status = 'RESULT';

      const myId = this.socketService.socketId;
      const myPlayerId = localStorage.getItem('player_id');

      const amIWinner = res.lotteryWinners.some((w: any) =>
        w.id === myId || (myPlayerId && w.playerId === myPlayerId)
      );

      setTimeout(() => {
        if (amIWinner) {
          this.resultMessage = "¡GANASTE EL SORTEO! 🎁 VE POR TU PREMIO";
        } else {
          this.resultMessage = "Sorteo finalizado. ¡Suerte la próxima!";
        }
      }, 25000);

      this.currentQuestionText = '';
    });
  }

  submitAnswer(idx: number) {
    if (this.status !== 'QUESTION' || !this.gameId) return;
    this.socketService.emit('SUBMIT_ANSWER', {
      gameId: this.gameId,
      answerIdx: idx
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
