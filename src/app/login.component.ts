
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketService } from './services/socket.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative">
      
      <!-- Logo TRIVIA -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">TRIVIA</h1>
      </div>

      <!-- Tarjeta de Ingreso -->
      <div class="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div class="mb-4">
          <label class="block text-gray-300 text-sm font-bold mb-2">Tu Nombre</label>
          <input [(ngModel)]="name" type="text" class="w-full bg-slate-800 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none focus:border-indigo-500 transition-colors">
        </div>

        <div class="mb-6">
          <label class="block text-gray-300 text-sm font-bold mb-2">DNI / Email</label>
          <input [(ngModel)]="extra" type="text" class="w-full bg-slate-800 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none focus:border-indigo-500 transition-colors">
        </div>

        <label class="block text-gray-300 text-sm font-bold mb-2">Elige Avatar</label>
        <div class="grid grid-cols-6 gap-2 mb-8">
          @for (av of avatars; track av) {
            <button (click)="selectedAvatar = av"
                    class="text-2xl p-2 rounded hover:bg-white/20 transition"
                    [class.bg-indigo-600]="selectedAvatar === av"
                    [class.ring-2]="selectedAvatar === av">
              {{ av }}
            </button>
          }
        </div>

        <button (click)="join()"
                [disabled]="!name || !selectedAvatar"
                class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 hover:scale-[1.02] transition-transform">
          ¡ENTRAR!
        </button>
      </div>
</div>
  `
})
export class LoginComponent implements OnInit {
  private socketService = inject(SocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  name = '';
  extra = '';
  selectedAvatar = '';
  avatars = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
  gameId: string | null = null;

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    if (!this.gameId) {
      this.router.navigate(['/']);
      return;
    }

    // Auto-login check
    const storedGameId = localStorage.getItem('game_id');
    const storedPlayerId = localStorage.getItem('player_id');
    const storedName = localStorage.getItem('player_name');
    const storedAvatar = localStorage.getItem('player_avatar');

    if (storedGameId === this.gameId && storedPlayerId && storedName && storedAvatar) {
      // Auto-join
      this.name = storedName;
      this.selectedAvatar = storedAvatar;
      this.join(storedPlayerId);
    }
  }

  join(existingPlayerId?: string) {
    if ((!this.name || !this.selectedAvatar) && !existingPlayerId) return;
    if (!this.gameId) return;

    const playerId = existingPlayerId || uuidv4();

    localStorage.setItem('player_name', this.name);
    localStorage.setItem('game_id', this.gameId);
    localStorage.setItem('player_id', playerId);
    localStorage.setItem('player_avatar', this.selectedAvatar);

    this.socketService.emit('JOIN_GAME', {
      gameId: this.gameId,
      name: this.name,
      extra: this.extra,
      avatar: this.selectedAvatar,
      playerId: playerId
    });
    this.router.navigate(['/game']);
  }
}
