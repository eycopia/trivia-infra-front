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

      <!-- 1. ESPERANDO -->
      @if (status === 'WAITING' || status === 'RESULT') {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
          <div class="text-7xl mb-6">👀</div>
          <h2 class="text-2xl text-white font-bold mb-2">Mira la pantalla</h2>
          <p class="text-slate-400">
             @if (status === 'RESULT') {
               <span class="text-yellow-400 font-bold block mb-2 text-xl">{{ resultMessage }}</span>
             }
             Esperando la siguiente pregunta...
          </p>
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

          <div class="grid grid-cols-2 gap-4 flex-1">
            <!-- Rojo -->
            <button (click)="submitAnswer(0)" class="active:scale-95 transition-transform bg-red-600 rounded-2xl shadow-[0_4px_0_rgb(153,27,27)] flex items-center justify-center">
                <span class="text-white text-5xl drop-shadow-md">▲</span>
            </button>

            <!-- Azul -->
            <button (click)="submitAnswer(1)" class="active:scale-95 transition-transform bg-blue-600 rounded-2xl shadow-[0_4px_0_rgb(30,58,138)] flex items-center justify-center">
                <span class="text-white text-5xl drop-shadow-md">◆</span>
            </button>

            <!-- Amarillo -->
            <button (click)="submitAnswer(2)" class="active:scale-95 transition-transform bg-yellow-500 rounded-2xl shadow-[0_4px_0_rgb(161,98,7)] flex items-center justify-center">
                <span class="text-white text-5xl drop-shadow-md">●</span>
            </button>

            <!-- Verde -->
            <button (click)="submitAnswer(3)" class="active:scale-95 transition-transform bg-green-600 rounded-2xl shadow-[0_4px_0_rgb(21,128,61)] flex items-center justify-center">
                <span class="text-white text-5xl drop-shadow-md">■</span>
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
  status: 'WAITING' | 'QUESTION' | 'ANSWER_SENT' | 'RESULT' = 'WAITING';
  myName: string = '';
  resultMessage: string = '';
  gameId: string | null = null;
  currentQuestionText: string = '';

  constructor() {
    this.myName = localStorage.getItem('player_name') || 'Jugador';
    this.gameId = localStorage.getItem('game_id');
  }

  ngOnInit() {
    // 1. Nueva pregunta inicia -> Mostrar botones
    this.socketService.fromEvent<any>('NEW_QUESTION').subscribe((q) => {
      this.status = 'QUESTION';
      this.resultMessage = '';
      this.currentQuestionText = q.t; // Guardar texto de la pregunta

      if (navigator.vibrate) navigator.vibrate(200);
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
