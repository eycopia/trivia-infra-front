import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ModalComponent } from './components/modal.component';

@Component({
    selector: 'app-admin-questions',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent],
    template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-3xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Gestionar Preguntas</h1>
            <button (click)="goBack()" class="text-gray-400 hover:text-white">Volver</button>
        </div>
        
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
          <h2 class="text-xl font-bold mb-4">Nueva Pregunta</h2>
          
          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Pregunta</label>
            <input [(ngModel)]="newQuestion.text" type="text" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
          </div>

          <div class="grid grid-cols-1 gap-4 mb-4">
            @for (opt of newQuestion.options; track $index) {
                <div>
                    <label class="block text-gray-300 text-xs font-bold mb-1">Opción {{ $index + 1 }}</label>
                    <div class="flex items-center">
                        <input [(ngModel)]="newQuestion.options[$index]" type="text" class="flex-1 bg-slate-700 text-white border border-slate-600 rounded-l-lg py-2 px-3 outline-none">
                        <button (click)="newQuestion.answer_idx = $index" 
                                [class.bg-green-600]="newQuestion.answer_idx === $index"
                                [class.bg-slate-600]="newQuestion.answer_idx !== $index"
                                class="px-3 py-2 rounded-r-lg border border-l-0 border-slate-600">
                            ✓
                        </button>
                    </div>
                </div>
            }
          </div>

          <button (click)="addQuestion()" 
                  [disabled]="!isValid()"
                  class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            Agregar Pregunta
          </button>
        </div>

        <div>
            <h2 class="text-xl font-bold mb-4">Preguntas Actuales ({{ questions.length }})</h2>
            @for (q of questions; track q.id) {
                <div class="bg-slate-800 p-4 rounded-lg mb-2 flex justify-between items-start">
                    <div class="flex-1">
                        <p class="font-bold text-lg">{{ q.text }}</p>
                        <ul class="mt-2 list-disc list-inside text-gray-300">
                            @for (opt of q.options; track opt; let i = $index) {
                                <li [class.text-green-400]="i === q.answer_idx">{{ opt }}</li>
                            }
                        </ul>
                    </div>
                    <button (click)="confirmDelete(q.id)" 
                            class="ml-4 text-red-400 hover:text-red-300 transition p-2"
                            title="Eliminar pregunta">
                        🗑️
                    </button>
                </div>
            }
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-modal [(isOpen)]="showDeleteModal" 
               type="confirm" 
               [title]="'Confirmar Eliminación'"
               [message]="'¿Estás seguro de que quieres eliminar esta pregunta?'"
               [confirmLabel]="'Eliminar'"
               [cancelLabel]="'Cancelar'"
               (confirm)="executeDelete()"
               (cancel)="cancelDelete()">
    </app-modal>

    <!-- Success/Error Modal -->
    <app-modal [(isOpen)]="showMessageModal" 
               type="alert" 
               [title]="messageTitle"
               [message]="messageText">
    </app-modal>
  `
})
export class AdminQuestionsComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    gameId: string | null = null;
    questions: any[] = [];

    newQuestion = {
        text: '',
        options: ['', '', '', ''],
        answer_idx: 0
    };

    // Modal state
    showDeleteModal = false;
    showMessageModal = false;
    messageTitle = '';
    messageText = '';
    deleteQuestionId: number | null = null;

    ngOnInit() {
        this.gameId = this.route.snapshot.paramMap.get('id');
        if (this.gameId) {
            this.loadQuestions();
        }
    }

    loadQuestions() {
        this.http.get<any[]>(`${environment.apiUrl}/api/games/${this.gameId}/questions`).subscribe(data => {
            this.questions = data;
        });
    }

    isValid() {
        return this.newQuestion.text && this.newQuestion.options.every(o => o.trim() !== '');
    }

    addQuestion() {
        if (!this.isValid() || !this.gameId) return;

        this.http.post(`${environment.apiUrl}/api/games/${this.gameId}/questions`, {
            text: this.newQuestion.text,
            options: this.newQuestion.options,
            answer_idx: this.newQuestion.answer_idx
        }).subscribe({
            next: () => {
                this.newQuestion = { text: '', options: ['', '', '', ''], answer_idx: 0 };
                this.loadQuestions();
            },
            error: (err) => {
                this.messageTitle = 'Error';
                this.messageText = 'Error: ' + err.message;
                this.showMessageModal = true;
            }
        });
    }

    confirmDelete(questionId: number) {
        this.deleteQuestionId = questionId;
        this.showDeleteModal = true;
    }

    executeDelete() {
        if (!this.deleteQuestionId) return;

        this.http.delete(`${environment.apiUrl}/api/games/questions/${this.deleteQuestionId}`).subscribe({
            next: () => {
                this.loadQuestions();
            },
            error: (err) => {
                this.messageTitle = 'Error';
                this.messageText = 'Error al eliminar: ' + err.message;
                this.showMessageModal = true;
            }
        });
    }

    cancelDelete() {
        this.deleteQuestionId = null;
    }

    goBack() {
        this.router.navigate(['/admin/games']);
    }
}
