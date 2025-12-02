import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from './services/socket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HostQuestionComponent } from './components/host-question.component';
import { HostLotteryComponent } from './components/host-lottery.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-host-screen',
  standalone: true,
  imports: [CommonModule, HostQuestionComponent, HostLotteryComponent],
  template: `
    <div class="h-screen bg-slate-900 text-white overflow-hidden relative font-sans">

      <!-- Top Bar -->
      <div class="absolute top-0 w-full p-4 flex justify-between z-10 bg-black/20 backdrop-blur-sm">
        <div class="text-xl font-bold">TRIVIA INFRA</div>
        <div class="text-xl bg-indigo-600 px-4 py-1 rounded-full">{{ playerCount }} Jugadores</div>
      </div>

      @if (gameKind === 'questions') {
          <app-host-question
              [gameState]="gameState"
              [currentQuestion]="currentQuestion"
              [currentQIndex]="currentQIndex"
              [totalQuestions]="questionsList.length"
              [leaderboard]="leaderboard"
              [roundWinners]="roundWinners"
              [correctAnswerIdx]="correctAnswerIdx"
              [timerDuration]="timerDuration"
              (startQuestion)="startNextQuestion()"
              (nextPhase)="nextPhase()"
              (exit)="exitGame()"
              (timeExpired)="closeQuestionManually()">
          </app-host-question>
      }

      @if (gameKind === 'lottery') {
          <app-host-lottery
              [lotteryState]="lotteryState"
              [lotteryWinners]="lotteryWinners"
              [allPlayersForLottery]="allPlayersForLottery"
              [timerDuration]="timerDuration"
              (startLottery)="startLottery()"
              (finishLottery)="finishLottery()"
              (exit)="exitGame()">
          </app-host-lottery>
      }

      <!-- Global Finish Button (only visible when appropriate) -->
      @if (gameState !== 'FINISHED') {
        <div class="absolute bottom-4 right-4 z-50">
            @if ( (gameKind === 'questions' && currentQIndex >= questionsList.length) || (gameKind === 'lottery' && lotteryState === 'RESULT') ) {
                <button (click)="finishGame()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-colors flex items-center gap-2">
                    <span>🏁</span> Terminar Juego
                </button>
            }
        </div>
      }
    </div>
  `
})
export class HostScreenComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  playerCount = 0;
  gameId: string | null = null;
  gameKind: 'questions' | 'lottery' = 'questions';

  // Estado compartido
  gameState: 'WAITING' | 'QUESTION' | 'RESULT' | 'FINISHED' = 'WAITING';
  timerDuration = 25;

  // Estado Questions
  currentQuestion: any = null;
  roundWinners: any[] = [];
  leaderboard: any[] = [];
  correctAnswerIdx: number = -1;
  questionsList: any[] = [];
  currentQIndex = 0;

  // Estado Lottery
  lotteryState: 'WAITING' | 'RUNNING' | 'RESULT' = 'WAITING';
  lotteryWinners: any[] = [];
  allPlayersForLottery: any[] = [];

  private routeSubscription: Subscription | null = null;
  private socketSubscriptions: Subscription[] = [];

  ngOnInit() {
    console.log("aaa verrr")
    // Escuchar cambios en la ruta para reiniciar el juego si cambia el ID
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const newGameId = params.get('gameId');
      console.log("newGameId", newGameId)
      if (newGameId && newGameId !== this.gameId) {
        this.gameId = newGameId;
        this.resetState();
        console.log("ire al setupSocketListeners")
        this.setupSocketListeners(); // Re-setup listeners for the new game
        this.initGame();
      } else if (!newGameId) {
        this.router.navigate(['/admin/create-game']);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.clearSocketSubscriptions();
  }

  clearSocketSubscriptions() {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    this.socketSubscriptions = [];
  }

  resetState() {
    this.gameState = 'WAITING';
    this.gameKind = 'questions'; // Default, se actualizará con sync
    this.currentQuestion = null;
    this.roundWinners = [];
    this.leaderboard = [];
    this.correctAnswerIdx = -1;
    this.questionsList = [];
    this.currentQIndex = 0;

    this.lotteryState = 'WAITING';
    this.lotteryWinners = [];
    this.allPlayersForLottery = [];
    this.playerCount = 0;
  }

  initGame() {
    if (!this.gameId) return;
    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_INIT_GAME', { token, gameId: this.gameId });
  }

  setupSocketListeners() {
    this.clearSocketSubscriptions(); // Clean up previous listeners

    // Escuchar Sincronización de Estado
    this.socketSubscriptions.push(
      this.socketService.fromEvent<any>('GAME_STATE_SYNC').subscribe(state => {
        this.gameState = state.status;

        if (state.gameSettings) {
          this.gameKind = state.gameSettings.game_kind || 'questions';
        }

        if (this.gameState === 'WAITING') {
          this.currentQIndex = state.currentQIndex + 1;
        } else {
          this.currentQIndex = state.currentQIndex;
        }

        this.questionsList = state.questions || [];
        this.playerCount = state.playerCount;

        if (state.currentQuestion) {
          this.currentQuestion = state.currentQuestion;
        }

        if (this.gameState === 'RESULT' && state.lastRoundResult) {
          if (state.lastRoundResult.isLottery) {
            this.gameKind = 'lottery';
            this.lotteryWinners = state.lastRoundResult.lotteryWinners;
            this.lotteryState = 'RESULT';
          } else {
            this.correctAnswerIdx = state.lastRoundResult.correctIdx;
            this.roundWinners = state.lastRoundResult.roundWinners;
          }
        }
      })
    );

    // Escuchar actualizaciones
    this.socketSubscriptions.push(
      this.socketService.fromEvent<number>('PLAYERS_UPDATE').subscribe(c => this.playerCount = c)
    );

    this.socketSubscriptions.push(
      this.socketService.fromEvent<any>('NEW_QUESTION').subscribe(q => {
        this.currentQuestion = q;
        this.gameState = 'QUESTION';
      })
    );

    this.socketSubscriptions.push(
      this.socketService.fromEvent<any>('ROUND_RESULTS').subscribe(res => {
        this.gameState = 'RESULT';
        this.correctAnswerIdx = res.correctIdx;
        this.roundWinners = res.roundWinners;
      })
    );

    this.socketSubscriptions.push(
      this.socketService.fromEvent<any>('LOTTERY_RESULTS').subscribe(res => {

        this.lotteryWinners = res.lotteryWinners;
        if (res.playersPool) {
          this.allPlayersForLottery = res.playersPool;
        }
        // El componente hijo iniciará la animación al recibir lotteryState='RUNNING'
        // Pero aquí solo recibimos resultados.
        // Debemos asegurarnos de que el estado pase a RUNNING si no lo estaba.
        // O mejor, el componente hijo maneja la animación cuando recibe los ganadores?
        // No, el hijo espera 'RUNNING'.
        // Al recibir resultados, ya tenemos ganadores.
        // La animación debe correr en el cliente.
        // Si recibimos resultados, significa que el backend ya terminó.
        // El frontend debe simular la espera.
        // En startLottery() ponemos RUNNING.
        // Aquí solo guardamos datos.
      })
    );

    this.socketSubscriptions.push(
      this.socketService.fromEvent<any[]>('LEADERBOARD_UPDATE').subscribe(l => {
        this.leaderboard = l;
        this.allPlayersForLottery = l;
      })
    );
  }

  // --- ACCIONES DEL ADMIN ---

  startNextQuestion() {
    if (this.currentQIndex >= this.questionsList.length) return;

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

  startLottery() {
    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_START_LOTTERY', { token, gameId: this.gameId });
    this.lotteryState = 'RUNNING';
  }

  finishLottery() {
    this.lotteryState = 'RESULT';
    this.gameState = 'RESULT';
  }

  finishGame() {
    if (!confirm('¿Estás seguro de terminar el juego? Los jugadores verán sus resultados finales.')) return;

    const token = localStorage.getItem('admin_token');
    this.socketService.emit('ADMIN_FINISH_GAME', { token, gameId: this.gameId });
    this.router.navigate(['/admin/games']);
  }

  exitGame() {
    this.router.navigate(['/admin/games']);
  }
}
