// 할 일 관리 시스템 JavaScript
class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.nextId = this.getNextId();
        this.currentEditingId = null;
        this.attachedFiles = [];
        this.completedSectionExpanded = false;
        this.currentContextMenuTodoId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateSidebarCounts();
        this.checkRecurringTasks();
    }

    // DOM 요소 초기화
    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.completedTodoList = document.getElementById('completedTodoList');
        this.completedSection = document.getElementById('completedSection');
        this.completedToggleIcon = document.getElementById('completedToggleIcon');
        this.completedSectionCount = document.getElementById('completedSectionCount');
        this.emptyState = document.getElementById('emptyState');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // 사이드바 요소들
        this.sidebarLinks = document.querySelectorAll('.sidebar-link');
        this.allCount = document.getElementById('allCount');
        this.todayCount = document.getElementById('todayCount');
        this.importantCount = document.getElementById('importantCount');
        this.scheduledCount = document.getElementById('scheduledCount');
        
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
        this.sideImportant = document.getElementById('sideImportant');
        this.sideInfoGroup = document.getElementById('sideInfoGroup');
        this.sideCreatedDate = document.getElementById('sideCreatedDate');
        this.sideUpdatedDate = document.getElementById('sideUpdatedDate');
        this.closeSidePanel = document.getElementById('closeSidePanel');
        this.cancelSide = document.getElementById('cancelSide');
        this.saveSide = document.getElementById('saveSide');
        this.overlay = document.getElementById('overlay');
        
        // 컨텍스트 메뉴 요소들
        this.contextMenu = document.getElementById('contextMenu');
        this.dateModal = document.getElementById('dateModal');
        this.datePickerInput = document.getElementById('datePickerInput');
        this.dateOptions = document.querySelectorAll('.date-option');
        this.confirmDatePicker = document.getElementById('confirmDatePicker');
        this.cancelDatePicker = document.getElementById('cancelDatePicker');
        this.closeDateModal = document.querySelector('.close-modal');
    }

    // 이벤트 바인딩
    bindEvents() {
        // 할 일 추가
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuickTodo();
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
        
        // 사이드바 메뉴 이벤트
        this.sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.currentTarget.dataset.filter;
                this.setSidebarFilter(filter);
            });
        });
        
        // 컨텍스트 메뉴 이벤트
        this.bindContextMenuEvents();
        
        // 날짜 선택 모달 이벤트
        this.bindDateModalEvents();
        
        // 전역 클릭 이벤트 (컨텍스트 메뉴 닫기)
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // 할일 목록에 우클릭 이벤트 바인딩
        document.addEventListener('contextmenu', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (todoItem) {
                e.preventDefault();
                const todoId = parseInt(todoItem.dataset.id);
                this.showContextMenu(e.pageX, e.pageY, todoId);
            }
        });
    }

    // 필터 설정
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
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
            isMyDay: false,
            isImportant: false
        };

        this.todos.unshift(newTodo);
        this.saveTodos();
        this.render();
        this.updateSidebarCounts();

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
        this.sideImportant.checked = false;
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
        this.sideImportant.checked = todo.isImportant || false;
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
        const newImportant = this.sideImportant.checked;
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
                todo.isImportant = newImportant;
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
                isMyDay: false,
                isImportant: newImportant
            };

            this.todos.unshift(newTodo);
            this.showNotification('할 일이 추가되었습니다!', 'success');
        }

        this.saveTodos();
        this.render();
        this.updateSidebarCounts();
        this.closeSidePanelDialog();
    }

    // 할 일 토글 (완료/미완료)
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            if (todo.completed) {
                todo.completedAt = new Date().toISOString();
                // 반복 할일인 경우 다음 반복 일정 설정
                if (todo.repeat && todo.repeat !== 'none') {
                    this.scheduleNextRecurrence(todo);
                }
            } else {
                delete todo.completedAt;
                // 미완료로 변경 시 다음 반복 일정 제거
                delete todo.nextRecurrenceDate;
            }
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            
            const message = todo.completed ? '할 일을 완료했습니다!' : '할 일을 미완료로 변경했습니다.';
            this.showNotification(message, 'success');
        }
    }

    // 다음 반복 일정 설정
    scheduleNextRecurrence(todo) {
        if (!todo.repeat || todo.repeat === 'none') return;

        const baseDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
        let nextDate = new Date(baseDate);

        switch (todo.repeat) {
            case 'daily':
                nextDate.setDate(baseDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(baseDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(baseDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(baseDate.getFullYear() + 1);
                break;
            default:
                return;
        }

        todo.nextRecurrenceDate = nextDate.toISOString().split('T')[0];
    }

    // 반복 할일 자동 생성 확인
    checkRecurringTasks() {
        const today = new Date().toISOString().split('T')[0];
        let newTasksCreated = 0;

        // 완료된 반복 할일들을 확인
        this.todos.forEach(todo => {
            if (todo.completed && 
                todo.repeat && 
                todo.repeat !== 'none' && 
                todo.nextRecurrenceDate &&
                todo.nextRecurrenceDate <= today) {
                
                // 새로운 반복 할일 생성
                const newTodo = {
                    ...todo,
                    id: this.nextId++,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    completedAt: null,
                    updatedAt: null,
                    isMyDay: false,
                    dueDate: todo.nextRecurrenceDate,
                    nextRecurrenceDate: null
                };

                this.todos.unshift(newTodo);
                
                // 원본 할일의 다음 반복 일정 제거
                delete todo.nextRecurrenceDate;
                
                newTasksCreated++;
            }
        });

        if (newTasksCreated > 0) {
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            this.showNotification(`${newTasksCreated}개의 반복 할일이 생성되었습니다.`, 'info');
        }

        // 매일 자정에 확인하도록 타이머 설정
        this.scheduleNextCheck();
    }

    // 다음 자동 확인 일정 설정
    scheduleNextCheck() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.checkRecurringTasks();
        }, timeUntilMidnight);
    }

    // 중요 표시 토글
    toggleImportant(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.isImportant = !todo.isImportant;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            
            const message = todo.isImportant ? '중요한 할일로 표시되었습니다!' : '중요 표시가 해제되었습니다.';
            this.showNotification(message, 'success');
        }
    }

    // 나의 하루 토글
    toggleMyDay(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.isMyDay = !todo.isMyDay;
            if (todo.isMyDay) {
                // 마감일을 오늘로 설정 (로컬 시간 기준)
                const today = new Date();
                const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
                todo.dueDate = todayStr;
            }
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            
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
            this.updateSidebarCounts();
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
            this.updateSidebarCounts();
            this.showNotification('모든 할 일이 삭제되었습니다.', 'success');
        }
    }

    // 사이드바 필터 설정
    setSidebarFilter(filter) {
        this.currentFilter = filter;
        this.updateSidebarLinks();
        this.updatePageTitle(filter);
        this.render();
        this.updateSidebarCounts();
    }

    // 페이지 제목 업데이트
    updatePageTitle(filter) {
        const header = document.querySelector('header h1');
        const titles = {
            'all': '📋 할일목록',
            'today': '📅 오늘할일', 
            'important': '⭐ 중요',
            'scheduled': '🗓️ 계획한 일정'
        };
        
        if (header && titles[filter]) {
            header.textContent = titles[filter];
        }
    }

    // 사이드바 링크 업데이트
    updateSidebarLinks() {
        this.sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.filter === this.currentFilter);
        });
    }

    // 사이드바 카운트 업데이트
    updateSidebarCounts() {
        const all = this.todos.length;
        const today = this.getTodayTodos().length;
        const important = this.getImportantTodos().length;
        const scheduled = this.getScheduledTodos().length;

        this.allCount.textContent = all;
        this.todayCount.textContent = today;
        this.importantCount.textContent = important;
        this.scheduledCount.textContent = scheduled;
    }

    // 오늘 할일 가져오기
    getTodayTodos() {
        const today = new Date().toISOString().split('T')[0];
        return this.todos.filter(todo => 
            !todo.completed && (
                todo.isMyDay || 
                todo.dueDate === today
            )
        );
    }

    // 중요한 할일 가져오기  
    getImportantTodos() {
        return this.todos.filter(todo => 
            !todo.completed && todo.isImportant === true
        );
    }

    // 계획한 일정 가져오기 (7일간)
    getScheduledTodos() {
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        
        return this.todos.filter(todo => {
            if (todo.completed || !todo.dueDate) return false;
            
            const dueDate = new Date(todo.dueDate);
            return dueDate >= today && dueDate <= weekFromNow;
        });
    }

    // 필터링된 할 일 목록 가져오기
    getFilteredTodos() {
        let filtered = this.todos;

        // 사이드바 필터
        switch (this.currentFilter) {
            case 'today':
                filtered = this.getTodayTodos();
                break;
            case 'important':
                filtered = this.getImportantTodos();
                break;
            case 'scheduled':
                filtered = this.getScheduledTodos();
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'pending':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'all':
            default:
                // 모든 할일 표시
                break;
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
        
        // 완료된 할일과 진행중인 할일 분리
        const pendingTodos = filteredTodos.filter(todo => !todo.completed);
        
        // 완료된 할일은 항상 전체 할일에서 가져오기 (필터 무시)
        const allCompletedTodos = this.todos.filter(todo => todo.completed);
        
        // 진행중인 할일 렌더링
        if (pendingTodos.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.todoList.innerHTML = pendingTodos.map(todo => this.renderTodoItem(todo)).join('');
        }
        
        // 완료된 할일 섹션 처리
        if (allCompletedTodos.length > 0) {
            this.completedSection.style.display = 'block';
            this.completedSectionCount.textContent = allCompletedTodos.length;
            this.completedTodoList.innerHTML = allCompletedTodos.map(todo => this.renderTodoItem(todo)).join('');
        } else {
            this.completedSection.style.display = 'none';
        }
    }

    // 할일 아이템 렌더링 헬퍼 함수
    renderTodoItem(todo) {
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoManager.toggleTodo(${todo.id})" onclick="event.stopPropagation()">
                <div class="todo-content clickable" onclick="todoManager.openSidePanel('edit', ${todo.id})">
                    <div class="todo-main-row">
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        <div class="todo-indicators">
                            ${todo.isImportant ? '<span class="important-indicator" title="중요한 할일">⭐</span>' : ''}
                            ${todo.repeat !== 'none' ? `<span class="repeat-indicator" title="반복: ${this.getRepeatText(todo.repeat)}">🔄</span>` : ''}
                            ${todo.files && todo.files.length > 0 ? `<span class="attachment-indicator" title="${todo.files.length}개 파일 첨부">📎</span>` : ''}
                            ${todo.memo ? '<span class="memo-indicator" title="메모 있음">📝</span>' : ''}
                        </div>
                    </div>
                    <div class="todo-meta">
                        <span class="priority-badge priority-${todo.priority}">
                            ${this.getPriorityText(todo.priority)}
                        </span>
                        ${this.getDueDateHtml(todo.dueDate)}
                        <span class="todo-date">${this.formatDate(todo.createdAt)}${todo.updatedAt ? ' (수정됨)' : ''}</span>
                    </div>
                </div>
            </li>
        `;
    }

    // 완료된 섹션 토글
    toggleCompletedSection() {
        this.completedSectionExpanded = !this.completedSectionExpanded;
        
        if (this.completedSectionExpanded) {
            this.completedTodoList.style.display = 'block';
            this.completedToggleIcon.textContent = '▼';
            this.completedToggleIcon.classList.add('expanded');
        } else {
            this.completedTodoList.style.display = 'none';
            this.completedToggleIcon.textContent = '▶';
            this.completedToggleIcon.classList.remove('expanded');
        }
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
            const todos = saved ? JSON.parse(saved) : [];
            
            // 기존 데이터 정리 - repeat 값이 없는 할일들에 'none' 설정
            return todos.map(todo => ({
                ...todo,
                repeat: todo.repeat || 'none',
                isImportant: todo.isImportant || false
            }));
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
    
    // 컨텍스트 메뉴 이벤트 바인딩
    bindContextMenuEvents() {
        // 컨텍스트 메뉴 항목 클릭 이벤트
        this.contextMenu.addEventListener('click', (e) => {
            const contextItem = e.target.closest('.context-item');
            if (!contextItem) return;
            
            const action = contextItem.dataset.action;
            this.handleContextMenuAction(action);
            this.hideContextMenu();
        });
    }
    
    // 날짜 선택 모달 이벤트 바인딩
    bindDateModalEvents() {
        // 날짜 옵션 버튼 클릭
        this.dateOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // 기존 선택 해제
                this.dateOptions.forEach(opt => opt.classList.remove('selected'));
                // 현재 선택 표시
                e.target.classList.add('selected');
                
                const days = parseInt(e.target.dataset.days);
                const date = new Date();
                date.setDate(date.getDate() + days);
                this.datePickerInput.value = date.toISOString().split('T')[0];
            });
        });
        
        // 확인 버튼
        this.confirmDatePicker.addEventListener('click', () => {
            const selectedDate = this.datePickerInput.value;
            if (selectedDate && this.currentContextMenuTodoId) {
                this.setTodoDueDate(this.currentContextMenuTodoId, selectedDate);
            }
            this.hideDateModal();
        });
        
        // 취소 버튼
        this.cancelDatePicker.addEventListener('click', () => {
            this.hideDateModal();
        });
        
        // 닫기 버튼
        this.closeDateModal.addEventListener('click', () => {
            this.hideDateModal();
        });
        
        // 모달 배경 클릭
        this.dateModal.addEventListener('click', (e) => {
            if (e.target === this.dateModal) {
                this.hideDateModal();
            }
        });
    }
    
    // 컨텍스트 메뉴 표시
    showContextMenu(x, y, todoId) {
        this.currentContextMenuTodoId = todoId;
        
        // 메뉴 위치 설정
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.classList.add('show');
        
        // 화면 밖으로 나가지 않도록 조정
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = (y - rect.height) + 'px';
        }
        
        // 할일 상태에 따라 메뉴 항목 업데이트
        this.updateContextMenuItems(todoId);
    }
    
    // 컨텍스트 메뉴 숨기기
    hideContextMenu() {
        this.contextMenu.classList.remove('show');
        this.currentContextMenuTodoId = null;
    }
    
    // 컨텍스트 메뉴 항목 업데이트
    updateContextMenuItems(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        // 중요로 표시/해제 텍스트 변경
        const importantItem = this.contextMenu.querySelector('[data-action="markImportant"]');
        if (importantItem) {
            importantItem.innerHTML = `
                <span class="context-icon">⭐</span>
                ${todo.isImportant ? '중요 표시 해제' : '중요로 표시'}
            `;
        }
        
        // 완료됨으로 표시/해제 텍스트 변경
        const completedItem = this.contextMenu.querySelector('[data-action="markCompleted"]');
        if (completedItem) {
            completedItem.innerHTML = `
                <span class="context-icon">✅</span>
                ${todo.completed ? '미완료로 표시' : '완료됨으로 표시'}
            `;
        }
        
        // 나의 하루 추가/제거 텍스트 변경
        const myDayItem = this.contextMenu.querySelector('[data-action="addToMyDay"]');
        if (myDayItem) {
            myDayItem.innerHTML = `
                <span class="context-icon">☀️</span>
                ${todo.isMyDay ? '나의 하루에서 제거' : '나의 하루 추가'}
            `;
        }
    }
    
    // 컨텍스트 메뉴 액션 처리
    handleContextMenuAction(action) {
        if (!this.currentContextMenuTodoId) return;
        
        const todoId = this.currentContextMenuTodoId;
        
        switch (action) {
            case 'addToMyDay':
                this.toggleMyDay(todoId);
                break;
            case 'markImportant':
                this.toggleImportant(todoId);
                break;
            case 'markCompleted':
                this.toggleTodo(todoId);
                break;
            case 'dueTomorrow':
                this.setTomorrowDueDate(todoId);
                break;
            case 'pickDate':
                this.showDatePicker();
                break;
            case 'removeDueDate':
                this.removeDueDate(todoId);
                break;
            case 'delete':
                this.deleteTodo(todoId);
                break;
        }
    }
    
    // 내일 마감일 설정
    setTomorrowDueDate(todoId) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        this.setTodoDueDate(todoId, dateString);
    }
    
    // 마감일 설정
    setTodoDueDate(todoId, dateString) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.dueDate = dateString;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString('ko-KR');
            this.showNotification(`마감일이 ${formattedDate}로 설정되었습니다.`, 'success');
        }
    }
    
    // 마감일 제거
    removeDueDate(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.dueDate = null;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            this.showNotification('마감일이 제거되었습니다.', 'success');
        }
    }
    
    // 날짜 선택기 표시
    showDatePicker() {
        // 현재 할일의 마감일로 초기화
        const todo = this.todos.find(t => t.id === this.currentContextMenuTodoId);
        if (todo && todo.dueDate) {
            this.datePickerInput.value = todo.dueDate;
        } else {
            this.datePickerInput.value = '';
        }
        
        // 선택된 옵션 초기화
        this.dateOptions.forEach(opt => opt.classList.remove('selected'));
        
        this.dateModal.classList.add('show');
        this.datePickerInput.focus();
    }
    
    // 날짜 선택 모달 숨기기
    hideDateModal() {
        this.dateModal.classList.remove('show');
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