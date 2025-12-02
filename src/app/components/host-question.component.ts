import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-host-question',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- ESTADO: LOBBY -->
    @if (gameState === 'WAITING') {
      <div class="h-full flex flex-col items-center justify-center">
        <h1 class="text-7xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          ¿Listos?
        </h1>
        <div class="text-3xl text-gray-400 mb-12">
          @if (currentQIndex < totalQuestions) {
              Próxima pregunta: #{{ currentQIndex + 1 }} / {{ totalQuestions }}
          } @else {
              ¡Juego Terminado!
          }
        </div>

        <div class="flex gap-4 mb-12">
            @for (p of leaderboard; track p.id) {
               <div class="flex flex-col items-center animate-bounce">
                  <span class="text-5xl">{{ p.avatar }}</span>
                  <span class="text-sm mt-2 font-bold">{{ p.name }}</span>
                  <span class="text-xs text-yellow-400">{{ p.score }} pts</span>
               </div>
            }
        </div>

        <div class="flex flex-col gap-4">
          <button (click)="onStartQuestion()" 
                  [disabled]="currentQIndex >= totalQuestions"
                  class="px-12 py-4 bg-white text-black text-2xl font-bold rounded-full hover:scale-105 transition disabled:opacity-50">
            {{ currentQIndex >= totalQuestions ? 'FIN DEL JUEGO' : 'INICIAR PREGUNTA' }}
          </button>
          
          <button (click)="onExit()" class="text-gray-500 hover:text-white underline">
              Salir al Panel
          </button>
        </div>
      </div>
    }

    <!-- ESTADO: PREGUNTA -->
    @if (gameState === 'QUESTION' && currentQuestion) {
      <div class="h-full flex flex-col pt-20 pb-8 px-8">
        <div class="w-full h-6 bg-gray-800 rounded-full mb-8 overflow-hidden border border-gray-600">
          <div class="h-full bg-yellow-400 transition-all duration-1000 ease-linear"
               [style.width.%]="(timeLeft / timerDuration) * 100"></div>
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

        <button (click)="onNextPhase()" class="mt-12 px-8 py-3 border border-white rounded-full hover:bg-white hover:text-black transition">
            Siguiente
        </button>
      </div>
    }
    <!-- ESTADO: FINISHED -->
    @if (gameState === 'FINISHED') {
      <div class="h-full flex flex-col items-center justify-center">
        <h1 class="text-7xl font-extrabold mb-8 text-white">
          🏁 JUEGO TERMINADO 🏁
        </h1>
        <div class="text-3xl text-gray-400 mb-12">
          Gracias por jugar
        </div>
        <button (click)="onExit()" class="px-12 py-4 bg-white text-black text-2xl font-bold rounded-full hover:scale-105 transition">
            Salir al Panel
        </button>
      </div>
    }
  `
})
export class HostQuestionComponent implements OnInit, OnDestroy {
    @Input() gameState: 'WAITING' | 'QUESTION' | 'RESULT' | 'FINISHED' = 'WAITING';
    @Input() currentQuestion: any = null;
    @Input() currentQIndex: number = 0;
    @Input() totalQuestions: number = 0;
    @Input() leaderboard: any[] = [];
    @Input() roundWinners: any[] = [];
    @Input() correctAnswerIdx: number = -1;
    @Input() timerDuration: number = 25;

    @Output() startQuestion = new EventEmitter<void>();
    @Output() nextPhase = new EventEmitter<void>();
    @Output() exit = new EventEmitter<void>();
    @Output() timeExpired = new EventEmitter<void>();

    timeLeft: number = 0;
    timerInterval: any;

    ngOnInit() {
        console.log("question state", this.gameState)
        this.timeLeft = this.timerDuration;
        if (this.gameState === 'QUESTION') {
            this.startTimer();
        }
    }

    ngOnChanges(changes: any) {
        if (changes.gameState && changes.gameState.currentValue === 'QUESTION') {
            this.startTimer();
        }
        if (changes.gameState && changes.gameState.currentValue === 'RESULT') {
            this.stopTimer();
        }
    }

    ngOnDestroy() {
        this.stopTimer();
    }

    startTimer() {
        this.timeLeft = this.timerDuration;
        this.stopTimer();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.timeExpired.emit();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    onStartQuestion() {
        this.startQuestion.emit();
    }

    onNextPhase() {
        this.nextPhase.emit();
    }

    onExit() {
        this.exit.emit();
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
