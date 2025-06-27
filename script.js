// 할 일 관리 시스템 JavaScript
class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.nextId = this.getNextId();
        this.currentEditingId = null;
        this.attachedFiles = [];
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    // DOM 요소 초기화
    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.addDetailBtn = document.getElementById('addDetailBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // 통계 요소들
        this.totalTodos = document.getElementById('totalTodos');
        this.pendingTodos = document.getElementById('pendingTodos');
        this.completedTodos = document.getElementById('completedTodos');
        this.statItems = document.querySelectorAll('.stat-item.clickable');
        
        // 사이드 패널 요소들
        this.sidePanel = document.getElementById('sidePanel');
        this.sidePanelTitle = document.getElementById('sidePanelTitle');
        this.sideTitle = document.getElementById('sideTitle');
        this.sidePriority = document.getElementById('sidePriority');
        this.sideDueDate = document.getElementById('sideDueDate');
        this.sideRepeat = document.getElementById('sideRepeat');
        this.sideFiles = document.getElementById('sideFiles');
        this.fileList = document.getElementById('fileList');
        this.sideMemo = document.getElementById('sideMemo');
        this.sideCharCount = document.getElementById('sideCharCount');
        this.sideInfoGroup = document.getElementById('sideInfoGroup');
        this.sideCreatedDate = document.getElementById('sideCreatedDate');
        this.sideUpdatedDate = document.getElementById('sideUpdatedDate');
        this.closeSidePanel = document.getElementById('closeSidePanel');
        this.cancelSide = document.getElementById('cancelSide');
        this.saveSide = document.getElementById('saveSide');
        this.overlay = document.getElementById('overlay');
    }

    // 이벤트 바인딩
    bindEvents() {
        // 할 일 추가
        this.addBtn.addEventListener('click', () => this.addQuickTodo());
        this.addDetailBtn.addEventListener('click', () => this.openSidePanel('add'));
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuickTodo();
        });

        // 필터링
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 통계 클릭 필터링
        this.statItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });

        this.priorityFilter.addEventListener('change', (e) => {
            this.currentPriorityFilter = e.target.value;
            this.render();
        });

        // 모든 할 일 삭제
        this.clearAllBtn.addEventListener('click', () => this.clearAllTodos());
        
        // 사이드 패널 이벤트
        this.closeSidePanel.addEventListener('click', () => this.closeSidePanelDialog());
        this.cancelSide.addEventListener('click', () => this.closeSidePanelDialog());
        this.saveSide.addEventListener('click', () => this.saveSideChanges());
        
        // 오버레이 클릭시 사이드 패널 닫기
        this.overlay.addEventListener('click', () => this.closeSidePanelDialog());
        
        // 메모 글자 수 카운트
        this.sideMemo.addEventListener('input', () => {
            const count = this.sideMemo.value.length;
            this.sideCharCount.textContent = count;
            if (count > 450) {
                this.sideCharCount.style.color = '#ff6b6b';
            } else {
                this.sideCharCount.style.color = '#888';
            }
        });

        // 파일 선택 이벤트
        this.sideFiles.addEventListener('change', (e) => this.handleFileSelection(e));
    }

    // 필터 설정
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.updateStatItems();
        this.render();
    }

    // 필터 버튼 업데이트
    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    // 통계 항목 활성화 상태 업데이트
    updateStatItems() {
        this.statItems.forEach(item => {
            item.classList.toggle('active', item.dataset.filter === this.currentFilter);
        });
    }

    // 다음 ID 생성
    getNextId() {
        return this.todos.length > 0 ? Math.max(...this.todos.map(t => t.id)) + 1 : 1;
    }

    // 빠른 할 일 추가
    addQuickTodo() {
        const text = this.todoInput.value.trim();

        if (!text) {
            this.showNotification('할 일을 입력해주세요!', 'error');
            this.todoInput.focus();
            return;
        }

        const newTodo = {
            id: this.nextId++,
            text: text,
            priority: 'medium',
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: null,
            memo: '',
            repeat: 'none',
            files: [],
            isMyDay: false
        };

        this.todos.unshift(newTodo);
        this.saveTodos();
        this.render();
        this.updateStats();

        this.todoInput.value = '';
        this.todoInput.focus();

        this.showNotification('할 일이 추가되었습니다!', 'success');
    }

    // 사이드 패널 열기
    openSidePanel(mode, todoId = null) {
        this.currentEditingId = todoId;
        this.attachedFiles = [];

        if (mode === 'add') {
            this.sidePanelTitle.textContent = '할 일 추가';
            this.resetSideForm();
            this.sideInfoGroup.style.display = 'none';
        } else if (mode === 'edit' && todoId) {
            const todo = this.todos.find(t => t.id === todoId);
            if (!todo) return;

            this.sidePanelTitle.textContent = '할 일 수정';
            this.fillSideForm(todo);
            this.sideInfoGroup.style.display = 'block';
        }

        this.sidePanel.classList.add('open');
        this.overlay.classList.add('show');
        this.sideTitle.focus();
    }

    // 사이드 패널 닫기
    closeSidePanelDialog() {
        this.sidePanel.classList.remove('open');
        this.overlay.classList.remove('show');
        this.currentEditingId = null;
        this.attachedFiles = [];
    }

    // 사이드 폼 초기화
    resetSideForm() {
        this.sideTitle.value = '';
        this.sidePriority.value = 'medium';
        this.sideDueDate.value = '';
        this.sideRepeat.value = 'none';
        this.sideFiles.value = '';
        this.sideMemo.value = '';
        this.sideCharCount.textContent = '0';
        this.fileList.innerHTML = '';
        this.attachedFiles = [];
    }

    // 사이드 폼 채우기
    fillSideForm(todo) {
        this.sideTitle.value = todo.text;
        this.sidePriority.value = todo.priority;
        this.sideDueDate.value = todo.dueDate || '';
        this.sideRepeat.value = todo.repeat || 'none';
        this.sideMemo.value = todo.memo || '';
        this.sideCharCount.textContent = (todo.memo || '').length;
        
        // 날짜 정보 표시
        this.sideCreatedDate.textContent = new Date(todo.createdAt).toLocaleString('ko-KR');
        this.sideUpdatedDate.textContent = todo.updatedAt ? 
            new Date(todo.updatedAt).toLocaleString('ko-KR') : '수정 이력 없음';

        // 파일 목록 표시
        this.attachedFiles = [...(todo.files || [])];
        this.renderFileList();
    }

    // 파일 선택 처리
    handleFileSelection(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // 10MB 제한
                this.showNotification(`파일 크기가 너무 큽니다: ${file.name}`, 'error');
                return;
            }

            const fileObj = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                data: null
            };

            // 파일을 Base64로 변환하여 저장
            const reader = new FileReader();
            reader.onload = (e) => {
                fileObj.data = e.target.result;
                this.attachedFiles.push(fileObj);
                this.renderFileList();
            };
            reader.readAsDataURL(file);
        });

        // 파일 입력 초기화
        e.target.value = '';
    }

    // 파일 목록 렌더링
    renderFileList() {
        this.fileList.innerHTML = this.attachedFiles.map((file, index) => `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-info">
                    <span class="file-icon">${this.getFileIcon(file.type)}</span>
                    <div>
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="remove-file" data-file-id="${file.id}">삭제</button>
            </div>
        `).join('');
        
        // 삭제 버튼에 이벤트 리스너 추가
        this.fileList.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.getAttribute('data-file-id');
                this.removeFile(fileId);
            });
        });
    }

    // 파일 아이콘 반환
    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('doc')) return '📝';
        if (type.includes('text')) return '📄';
        return '📎';
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 파일 제거
    removeFile(fileId) {
        console.log('Removing file with ID:', fileId);
        console.log('Current files:', this.attachedFiles);
        
        this.attachedFiles = this.attachedFiles.filter(f => f.id.toString() !== fileId.toString());
        this.renderFileList();
        
        console.log('Files after removal:', this.attachedFiles);
        this.showNotification('파일이 제거되었습니다.', 'success');
    }

    // 사이드 패널 변경사항 저장
    saveSideChanges() {
        const newText = this.sideTitle.value.trim();
        const newPriority = this.sidePriority.value;
        const newDueDate = this.sideDueDate.value || null;
        const newRepeat = this.sideRepeat.value;
        const newMemo = this.sideMemo.value.trim();

        if (!newText) {
            this.showNotification('할 일 내용을 입력해주세요!', 'error');
            this.sideTitle.focus();
            return;
        }

        if (this.currentEditingId) {
            // 수정 모드
            const todo = this.todos.find(t => t.id === this.currentEditingId);
            if (todo) {
                todo.text = newText;
                todo.priority = newPriority;
                todo.dueDate = newDueDate;
                todo.repeat = newRepeat;
                todo.memo = newMemo;
                todo.files = [...this.attachedFiles];
                todo.updatedAt = new Date().toISOString();

                this.showNotification('할 일이 수정되었습니다!', 'success');
            }
        } else {
            // 추가 모드
            const newTodo = {
                id: this.nextId++,
                text: newText,
                priority: newPriority,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: newDueDate,
                memo: newMemo,
                repeat: newRepeat,
                files: [...this.attachedFiles],
                isMyDay: false
            };

            this.todos.unshift(newTodo);
            this.showNotification('할 일이 추가되었습니다!', 'success');
        }

        this.saveTodos();
        this.render();
        this.updateStats();
        this.closeSidePanelDialog();
    }

    // 할 일 토글 (완료/미완료)
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            if (todo.completed) {
                todo.completedAt = new Date().toISOString();
                // 반복 작업 처리
                this.handleRecurringTask(todo);
            } else {
                delete todo.completedAt;
            }
            this.saveTodos();
            this.render();
            this.updateStats();
            
            const message = todo.completed ? '할 일을 완료했습니다!' : '할 일을 미완료로 변경했습니다.';
            this.showNotification(message, 'success');
        }
    }

    // 반복 작업 처리
    handleRecurringTask(todo) {
        if (todo.repeat === 'none') return;

        const newTodo = {
            ...todo,
            id: this.nextId++,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            isMyDay: false
        };

        // 다음 마감일 계산
        if (todo.dueDate) {
            const currentDue = new Date(todo.dueDate);
            let nextDue = new Date(currentDue);

            switch (todo.repeat) {
                case 'daily':
                    nextDue.setDate(currentDue.getDate() + 1);
                    break;
                case 'weekly':
                    nextDue.setDate(currentDue.getDate() + 7);
                    break;
                case 'monthly':
                    nextDue.setMonth(currentDue.getMonth() + 1);
                    break;
                case 'yearly':
                    nextDue.setFullYear(currentDue.getFullYear() + 1);
                    break;
            }

            newTodo.dueDate = nextDue.toISOString().split('T')[0];
        }

        this.todos.unshift(newTodo);
        this.showNotification(`반복 작업이 생성되었습니다 (${this.getRepeatText(todo.repeat)})`, 'info');
    }

    // 나의 하루 토글
    toggleMyDay(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.isMyDay = !todo.isMyDay;
            if (todo.isMyDay) {
                // 마감일을 오늘로 설정
                const today = new Date().toISOString().split('T')[0];
                todo.dueDate = today;
            }
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateStats();
            
            const message = todo.isMyDay ? '나의 하루에 추가되었습니다!' : '나의 하루에서 제거되었습니다.';
            this.showNotification(message, 'success');
        }
    }

    // 할 일 삭제
    deleteTodo(id) {
        if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('할 일이 삭제되었습니다.', 'success');
        }
    }

    // 모든 할 일 삭제
    clearAllTodos() {
        if (this.todos.length === 0) {
            this.showNotification('삭제할 할 일이 없습니다.', 'info');
            return;
        }

        if (confirm('정말로 모든 할 일을 삭제하시겠습니까?')) {
            this.todos = [];
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('모든 할 일이 삭제되었습니다.', 'success');
        }
    }

    // 필터링된 할 일 목록 가져오기
    getFilteredTodos() {
        let filtered = this.todos;

        // 상태 필터
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        }

        // 우선순위 필터
        if (this.currentPriorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === this.currentPriorityFilter);
        }

        return filtered;
    }

    // 화면 렌더링
    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');
        
        this.todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoManager.toggleTodo(${todo.id})">
                <div class="todo-content">
                    <span class="todo-text clickable" onclick="todoManager.openSidePanel('edit', ${todo.id})">${this.escapeHtml(todo.text)}</span>
                    <span class="priority-badge priority-${todo.priority}">
                        ${this.getPriorityText(todo.priority)}
                    </span>
                    ${this.getDueDateHtml(todo.dueDate)}
                    ${todo.repeat !== 'none' ? `<span class="repeat-indicator" title="반복: ${this.getRepeatText(todo.repeat)}">🔄</span>` : ''}
                    ${todo.files && todo.files.length > 0 ? `<span class="attachment-indicator" title="${todo.files.length}개 파일 첨부">📎</span>` : ''}
                    ${todo.memo ? '<span class="memo-indicator" title="메모 있음">📝</span>' : ''}
                    <span class="todo-date">${this.formatDate(todo.createdAt)}${todo.updatedAt ? ' (수정됨)' : ''}</span>
                </div>
                <div class="todo-actions">
                    <button class="my-day-btn ${todo.isMyDay ? 'active' : ''}" onclick="todoManager.toggleMyDay(${todo.id})" title="나의 하루에 추가">
                        ${todo.isMyDay ? '⭐' : '☆'}
                    </button>
                    <button class="edit-btn" onclick="todoManager.openSidePanel('edit', ${todo.id})" ${todo.completed ? 'disabled' : ''}>
                        수정
                    </button>
                    <button class="delete-btn" onclick="todoManager.deleteTodo(${todo.id})">
                        삭제
                    </button>
                </div>
            </li>
        `).join('');
    }

    // 통계 업데이트
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTodos.textContent = total;
        this.completedTodos.textContent = completed;
        this.pendingTodos.textContent = pending;
    }

    // 우선순위 텍스트 변환
    getPriorityText(priority) {
        const priorities = {
            'high': '높음',
            'medium': '보통',
            'low': '낮음'
        };
        return priorities[priority] || priority;
    }

    // 반복 텍스트 변환
    getRepeatText(repeat) {
        const repeats = {
            'none': '반복 안함',
            'daily': '매일',
            'weekly': '매주',
            'monthly': '매월',
            'yearly': '매년'
        };
        return repeats[repeat] || repeat;
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // 마감일 HTML 생성
    getDueDateHtml(dueDate) {
        if (!dueDate) return '';
        
        const due = new Date(dueDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        
        const diffTime = dueDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let className = 'normal';
        let text = due.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        
        if (diffDays < 0) {
            className = 'overdue';
            text = `기한 만료 (${Math.abs(diffDays)}일 전)`;
        } else if (diffDays === 0) {
            className = 'due-soon';
            text = '오늘 마감';
        } else if (diffDays === 1) {
            className = 'due-soon';
            text = '내일 마감';
        } else if (diffDays <= 3) {
            className = 'due-soon';
            text = `${diffDays}일 후`;
        }
        
        return `<span class="due-date ${className}">📅 ${text}</span>`;
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1002;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        const colors = {
            'success': '#51cf66',
            'error': '#ff6b6b',
            'info': '#667eea'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    // 로컬 스토리지에서 할 일 불러오기
    loadTodos() {
        try {
            const saved = localStorage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('할 일 목록을 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 로컬 스토리지에 할 일 저장
    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('할 일 목록을 저장하는 중 오류 발생:', error);
            this.showNotification('데이터 저장 중 오류가 발생했습니다.', 'error');
        }
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// 앱 초기화
let todoManager;
document.addEventListener('DOMContentLoaded', () => {
    todoManager = new TodoManager();
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 할 일 추가
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        todoManager.addQuickTodo();
    }
    
    // Escape: 사이드 패널 닫기 또는 입력 필드 포커스 해제
    if (e.key === 'Escape') {
        if (todoManager.sidePanel.classList.contains('open')) {
            todoManager.closeSidePanelDialog();
        } else {
            document.activeElement.blur();
        }
    }
});