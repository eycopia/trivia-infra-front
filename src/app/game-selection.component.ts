import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from './services/socket.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-game-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <!-- Header con info del jugador -->
      <div class="w-full max-w-4xl mb-6">
        <div class="flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2 w-fit">
          <span class="text-3xl">{{ playerAvatar }}</span>
          <div>
            <div class="text-white font-bold">{{ playerName }}</div>
            <div class="text-gray-400 text-sm">{{ playerExtra }}</div>
          </div>
        </div>
      </div>

      <div class="text-center mb-8 relative">
        <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">
        🎄 La TRIVIA de Infra & Ops 🎄
        </h1>
        <p class="text-gray-400 mt-2">Selecciona un juego para comenzar</p>        
      </div>

      <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @if (loading) {
            <div class="text-white text-center col-span-full">Cargando juegos...</div>
        } @else if (games.length === 0) {
            <div class="text-white text-center col-span-full">No hay juegos disponibles.</div>
        } @else {
            @for (game of games; track game.id) {
                <div (click)="selectGame(game.id)" 
                     class="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl hover:bg-white/20 transition cursor-pointer group">
                    <h2 class="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition">{{ game.title }}</h2>
                    <p class="text-gray-300">{{ game.description }}</p>
                    <div class="mt-3 text-xs text-gray-400">
                      <span class="bg-indigo-500/20 px-2 py-1 rounded">
                        {{ game.game_kind === 'lottery' ? '🎲 Sorteo' : '❓ Preguntas' }}
                      </span>
                    </div>
                </div>
            }
        }
      </div>
      <div class="mt-8">
        <button (click)="goToAdmin()" class="text-sm text-white/20 hover:text-white/60 transition-colors cursor-pointer outline-none">
          Ingreso del organizador >
        </button>
      </div>
    </div>
    
  `
})
export class GameSelectionComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private socketService = inject(SocketService);

  games: any[] = [];
  loading = true;
  playerName = '';
  playerExtra = '';
  playerAvatar = '';

  ngOnInit() {
    // Verificar que el jugador esté logueado
    this.playerName = localStorage.getItem('player_name') || '';
    this.playerExtra = localStorage.getItem('player_extra') || '';
    this.playerAvatar = localStorage.getItem('player_avatar') || '';

    if (!this.playerName || !this.playerAvatar) {
      this.router.navigate(['/']);
      return;
    }

    this.http.get<any[]>(`${environment.apiUrl}/api/games`).subscribe({
      next: (data) => {
        this.games = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading games', err);
        this.loading = false;
      }
    });
  }

  selectGame(gameId: number) {
    const playerId = localStorage.getItem('player_id');

    // Guardar gameId
    localStorage.setItem('game_id', gameId.toString());

    // Conectar al socket
    this.socketService.emit('JOIN_GAME', {
      gameId: gameId.toString(),
      name: this.playerName,
      extra: this.playerExtra,
      avatar: this.playerAvatar,
      playerId: playerId
    });

    this.router.navigate(['/game', gameId]);
  }

  goToAdmin() {
    this.router.navigate(['/admin/login']);
  }
}
