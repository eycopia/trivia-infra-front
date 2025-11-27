import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from './services/socket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-host-screen',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="h-screen bg-slate-900 text-white overflow-hidden relative font-sans">

      <!-- Top Bar -->
      <div class="absolute top-0 w-full p-4 flex justify-between z-10 bg-black/20 backdrop-blur-sm">
        <div class="text-xl font-bold">TRIVIA NIGHT</div>
        <div class="text-xl bg-indigo-600 px-4 py-1 rounded-full">{{ playerCount }} Jugadores</div>
      </div>

      <!-- ESTADO: LOBBY -->
      @if (gameState === 'WAITING') {
        <div class="h-full flex flex-col items-center justify-center">
          <h1 class="text-7xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            ¿Listos?
          </h1>
          <div class="text-3xl text-gray-400 mb-12">Próxima pregunta: #{{ currentQIndex + 1 }} / {{ questionsList.length }}</div>

          <div class="flex gap-4 mb-12">
              @for (p of leaderboard; track p.id) {
                 <div class="flex flex-col items-center animate-bounce">
                    <span class="text-5xl">{{ p.avatar }}</span>
                    <span class="text-sm mt-2 font-bold">{{ p.name }}</span>
                    <span class="text-xs text-yellow-400">{{ p.score }} pts</span>
                 </div>
              }
          </div>

          <button (click)="startNextQuestion()" 
                  [disabled]="currentQIndex >= questionsList.length"
                  class="px-12 py-4 bg-white text-black text-2xl font-bold rounded-full hover:scale-105 transition disabled:opacity-50">
            {{ currentQIndex >= questionsList.length ? 'FIN DEL JUEGO' : 'INICIAR PREGUNTA' }}
          </button>
        </div>
      }

      <!-- ESTADO: PREGUNTA -->
      @if (gameState === 'QUESTION' && currentQuestion) {
        <div class="h-full flex flex-col pt-20 pb-8 px-8">
          <div class="w-full h-6 bg-gray-800 rounded-full mb-8 overflow-hidden border border-gray-600">
            <div class="h-full bg-yellow-400 transition-all duration-1000 ease-linear"
                 [style.width.%]="(timeLeft / 20) * 100"></div>
          </div>

          <h2 class="text-5xl font-bold text-center mb-12">{{ currentQuestion.t }}</h2>

          <div class="grid grid-cols-2 gap-8 flex-1">
             @for (opt of currentQuestion.options; track opt; let i = $index) {
                <div class="rounded-2xl flex items-center p-8 text-4xl font-bold shadow-2xl"
                     [ngClass]="getOptionColor(i)">
                    <span class="mr-6 opacity-50">{{ getOptionSymbol(i) }}</span> {{ opt }}
                </div>
             }
          </div>
        </div>
      }

      <!-- ESTADO: RESULTADO -->
      @if (gameState === 'RESULT') {
        <div class="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h2 class="text-4xl text-gray-400 mb-8 uppercase tracking-widest">Respuesta Correcta</h2>

          @if (currentQuestion) {
             <div class="text-6xl font-bold mb-12 p-6 bg-green-600 rounded-xl shadow-[0_0_50px_rgba(22,163,74,0.6)]">
                {{ currentQuestion.options[correctAnswerIdx] }}
             </div>
          }

          @if (roundWinners.length > 0) {
              <h3 class="text-3xl text-yellow-400 font-bold mb-6 text-center animate-bounce">¡GANADORES DE PREMIO FLASH!</h3>
              <div class="flex gap-8">
                  @for (w of roundWinners; track w.id) {
                      <div class="bg-white text-black p-6 rounded-2xl text-center min-w-[200px]">
                          <div class="text-6xl mb-2">{{ w.avatar }}</div>
                          <div class="text-2xl font-bold">{{ w.name }}</div>
                      </div>
                  }
              </div>
          } @else {
              <div class="text-2xl text-gray-500 mb-8">Nadie ganó premio inmediato en esta ronda</div>
          }

          <button (click)="nextPhase()" class="mt-12 px-8 py-3 border border-white rounded-full hover:bg-white hover:text-black transition">
              Siguiente
          </button>
        </div>
      }
    </div>
  `
})
export class HostScreenComponent implements OnInit {
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  playerCount = 0;
  gameId: string | null = null;

  // Estado del juego
  currentQuestion: any = null;
  gameState: 'WAITING' | 'QUESTION' | 'RESULT' = 'WAITING';

  // Datos para mostrar
  timeLeft = 20; // Segundos
  timerInterval: any;

  roundWinners: any[] = [];
  leaderboard: any[] = [];
  correctAnswerIdx: number = -1;

  questionsList: any[] = [];
  currentQIndex = 0;

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    if (!this.gameId) {
      this.router.navigate(['/admin/create-game']);
      return;
    }

    // Inicializar juego en backend
    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_INIT_GAME', { token, gameId: this.gameId });

    // Escuchar Sincronización de Estado (Reconexión o Inicio)
    this.socketService.fromEvent<any>('GAME_STATE_SYNC').subscribe(state => {
      console.log("sync", state)
      this.gameState = state.status;
      this.currentQIndex = state.currentQIndex;
      this.questionsList = state.questions;
      this.playerCount = state.playerCount;

      if (state.currentQuestion) {
        this.currentQuestion = state.currentQuestion;
      }

      if (this.gameState === 'QUESTION') {
        this.startTimer(); // Reiniciar timer visualmente (idealmente sincronizar tiempo exacto)
      }
    });

    // Escuchar actualizaciones
    this.socketService.fromEvent<number>('PLAYERS_UPDATE').subscribe(c => this.playerCount = c);

    this.socketService.fromEvent<any>('NEW_QUESTION').subscribe(q => {
      this.currentQuestion = q;
      this.gameState = 'QUESTION';
      this.startTimer();
    });

    this.socketService.fromEvent<any>('ROUND_RESULTS').subscribe(res => {
      this.gameState = 'RESULT';
      this.correctAnswerIdx = res.correctIdx;
      this.roundWinners = res.roundWinners;
      clearInterval(this.timerInterval);
    });

    this.socketService.fromEvent<any[]>('LEADERBOARD_UPDATE').subscribe(l => this.leaderboard = l);
  }

  // --- ACCIONES DEL ADMIN ---

  startNextQuestion() {
    if (this.currentQIndex >= this.questionsList.length) return;
    console.log("aaaaaaaaaaaaaa", this.currentQIndex, this.questionsList.length)

    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_START_QUESTION', {
      token,
      gameId: this.gameId,
      qIndex: this.currentQIndex
    });

    // Limpiezas locales
    this.correctAnswerIdx = -1;
    this.roundWinners = [];
  }

  closeQuestionManually() {
    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_CLOSE_QUESTION', { token, gameId: this.gameId });
  }

  nextPhase() {
    this.currentQIndex++;
    this.gameState = 'WAITING';
    this.currentQuestion = null;
  }

  // --- UTILIDADES ---
  startTimer() {
    this.timeLeft = 20;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.closeQuestionManually();
      }
    }, 1000);
  }

  getOptionColor(index: number) {
    const colors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-600', 'bg-green-600'];
    return colors[index % colors.length];
  }

  getOptionSymbol(index: number) {
    const symbols = ['▲', '◆', '●', '■'];
    return symbols[index % symbols.length];
  }
}
