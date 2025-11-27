import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-admin-create-game',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule],
    template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-2xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
                <button (click)="goHome()" class="text-gray-400 hover:text-white text-2xl">←</button>
                <h1 class="text-3xl font-bold">Crear Nuevo Juego</h1>
            </div>
            <button (click)="goToWinners()" class="text-indigo-400 hover:text-indigo-300">Ver Ganadores</button>
        </div>
        
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Título del Juego</label>
            <input [(ngModel)]="title" type="text" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
          </div>

          <div class="mb-6">
            <label class="block text-gray-300 text-sm font-bold mb-2">Descripción</label>
            <textarea [(ngModel)]="description" rows="3" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none"></textarea>
          </div>

          <button (click)="createGame()" 
                  [disabled]="!title"
                  class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            Crear Juego
          </button>
        </div>

        <div class="mt-8">
            <h2 class="text-xl font-bold mb-4">Juegos Existentes</h2>
            @for (game of games; track game.id) {
                <div class="bg-slate-800 p-4 rounded-lg mb-2 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">{{ game.title }}</h3>
                        <p class="text-sm text-gray-400">{{ game.description }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button (click)="hostGame(game.id)" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm">
                            Hostear
                        </button>
                        <button (click)="manageQuestions(game.id)" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm">
                            Gestionar Preguntas
                        </button>
                    </div>
                </div>
            }
        </div>
      </div>
    </div>
  `
})
export class AdminCreateGameComponent {
    private http = inject(HttpClient);
    private router = inject(Router);

    title = '';
    description = '';
    games: any[] = [];

    ngOnInit() {
        this.loadGames();
    }

    loadGames() {
        this.http.get<any[]>(`${environment.apiUrl}/api/games`).subscribe(data => {
            this.games = data;
        });
    }

    createGame() {
        if (!this.title) return;

        const token = localStorage.getItem('admin_token');
        const headers = new HttpHeaders().set('Authorization', token || '');

        this.http.post(`${environment.apiUrl}/api/games`, {
            title: this.title,
            description: this.description
        }, { headers }).subscribe({
            next: () => {
                this.title = '';
                this.description = '';
                this.loadGames();
            },
            error: (err) => alert('Error al crear juego: ' + err.message)
        });
    }

    manageQuestions(gameId: number) {
        this.router.navigate(['/admin/game', gameId, 'questions']);
    }

    hostGame(gameId: number) {
        this.router.navigate(['/admin/host', gameId]);
    }

    goToWinners() {
        this.router.navigate(['/admin/winners']);
    }

    goHome() {
        this.router.navigate(['/']);
    }
}
