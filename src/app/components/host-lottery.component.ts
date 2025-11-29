import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-host-lottery',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (lotteryState === 'WAITING') {
        <div class="h-full flex flex-col items-center justify-center">
            <h1 class="text-7xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-500">
              GRAN SORTEO
            </h1>
            <p class="text-2xl text-gray-400 mb-12">Esperando para iniciar...</p>
            
            <button (click)="onStartLottery()" 
                    class="px-12 py-4 bg-gradient-to-r from-pink-600 to-yellow-600 text-white text-2xl font-bold rounded-full hover:scale-105 transition shadow-lg shadow-pink-500/50">
              INICIAR SORTEO 🎲
            </button>
            
            <button (click)="onExit()" class="mt-8 text-gray-500 hover:text-white underline">
                Salir al Panel
            </button>
        </div>
    }

    @if (lotteryState === 'RUNNING') {
        <div class="h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-[url('/assets/confetti.gif')] opacity-20"></div>
            
            <h2 class="text-4xl font-bold text-white mb-12 animate-pulse">Buscando ganadores...</h2>
            
            <!-- Ruleta Animation -->
            <div class="w-96 h-96 rounded-full border-8 border-yellow-500 flex items-center justify-center bg-slate-800 shadow-[0_0_100px_rgba(234,179,8,0.5)] relative overflow-hidden">
                @if (currentLotteryPlayer) {
                    <div class="text-center animate-bounce">
                        <div class="text-9xl mb-4">{{ currentLotteryPlayer.avatar }}</div>
                        <div class="text-4xl font-bold text-white">{{ currentLotteryPlayer.name }}</div>
                    </div>
                } @else {
                    <div class="text-6xl">🎲</div>
                }
            </div>
            
            <div class="mt-12 w-full max-w-md h-4 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-pink-500 to-yellow-500 transition-all duration-1000 ease-linear"
                     [style.width.%]="(timeLeft / timerDuration) * 100"></div>
            </div>
        </div>
    }

    @if (lotteryState === 'RESULT') {
        <div class="h-full flex flex-col items-center justify-center">
            <h1 class="text-6xl font-extrabold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
              🎉 ¡GANADORES! 🎉
            </h1>
            
            <div class="flex flex-wrap justify-center gap-8 max-w-6xl">
                @for (winner of lotteryWinners; track winner.id) {
                    <div class="bg-gradient-to-b from-slate-800 to-slate-900 p-8 rounded-2xl border-2 border-yellow-500/50 shadow-2xl flex flex-col items-center min-w-[250px] animate-scaleIn">
                        <div class="text-8xl mb-4">{{ winner.avatar }}</div>
                        <div class="text-3xl font-bold text-white mb-2">{{ winner.name }}</div>
                        <div class="text-yellow-400 font-mono">{{ winner.extra }}</div>
                    </div>
                }
            </div>
            
            <button (click)="onExit()" class="mt-16 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition border border-white/20">
                Volver al Panel
            </button>
        </div>
    }
  `
})
export class HostLotteryComponent implements OnInit, OnDestroy {
    @Input() lotteryState: 'WAITING' | 'RUNNING' | 'RESULT' = 'WAITING';
    @Input() lotteryWinners: any[] = [];
    @Input() allPlayersForLottery: any[] = [];
    @Input() timerDuration: number = 25;

    @Output() startLottery = new EventEmitter<void>();
    @Output() exit = new EventEmitter<void>();
    @Output() finishLottery = new EventEmitter<void>();

    timeLeft: number = 0;
    timerInterval: any;
    lotteryAnimationInterval: any;
    currentLotteryPlayer: any = null;

    ngOnInit() {
        this.timeLeft = this.timerDuration;
    }

    ngOnChanges(changes: any) {
        if (changes.lotteryState && changes.lotteryState.currentValue === 'RUNNING') {
            this.startAnimation();
        }
    }

    ngOnDestroy() {
        this.stopAnimation();
    }

    startAnimation() {
        this.timeLeft = this.timerDuration;
        this.stopAnimation();

        // Animación de ruleta
        this.lotteryAnimationInterval = setInterval(() => {
            if (this.allPlayersForLottery.length > 0) {
                const randIdx = Math.floor(Math.random() * this.allPlayersForLottery.length);
                this.currentLotteryPlayer = this.allPlayersForLottery[randIdx];
            }
        }, 100);

        // Timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.stopAnimation();
                this.finishLottery.emit();
            }
        }, 1000);
    }

    stopAnimation() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.lotteryAnimationInterval) clearInterval(this.lotteryAnimationInterval);
    }

    onStartLottery() {
        this.startLottery.emit();
    }

    onExit() {
        this.exit.emit();
    }
}
