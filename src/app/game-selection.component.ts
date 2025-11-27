import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-game-selection',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
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

  games: any[] = [];
  loading = true;

  ngOnInit() {
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
    this.router.navigate(['/login', gameId]);
  }

  goToAdmin() {
    this.router.navigate(['/admin/login']);
  }
}
