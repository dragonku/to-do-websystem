// 할 일 관리 시스템 JavaScript
class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
        this.lists = this.loadLists();
        this.currentFilter = 'all';
        this.currentList = null;
        this.currentPriorityFilter = 'all';
        this.searchQuery = '';
        this.sortBy = 'newest';
        this.sortOrder = 'desc'; // 'asc' or 'desc'
        this.nextId = this.getNextId();
        this.nextListId = this.getNextListId();
        this.currentEditingId = null;
        this.attachedFiles = [];
        this.completedSectionExpanded = false;
        this.currentContextMenuTodoId = null;
        this.currentContextMenuListId = null;
        this.isManagingLists = false;
        this.settings = this.loadSettings();

        // 캘린더 관련 속성
        this.isCalendarView = false;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();

        this.initializeElements();
        this.bindEvents();
        this.bindListEvents();
        this.applySettings();
        this.renderLists();
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
        this.sideList = document.getElementById('sideList');
        this.sidePriority = document.getElementById('sidePriority');
        this.sideDueDate = document.getElementById('sideDueDate');
        this.sideRepeat = document.getElementById('sideRepeat');
        this.sideFiles = document.getElementById('sideFiles');
        this.fileList = document.getElementById('fileList');
        this.sideMemo = document.getElementById('sideMemo');
        this.sideCharCount = document.getElementById('sideCharCount');
        this.sideImportant = document.getElementById('sideImportant');
        this.sideCalendar = document.getElementById('sideCalendar');
        this.sideStartDate = document.getElementById('sideStartDate');
        this.calendarDateFields = document.getElementById('calendarDateFields');
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
        
        // 검색 및 정렬 요소들
        this.sidebarSearchInput = document.getElementById('sidebarSearchInput');
        this.clearSidebarSearch = document.getElementById('clearSidebarSearch');
        this.sortSelect = document.getElementById('sortSelect');
        this.toggleSortOrder = document.getElementById('toggleSortOrder');
        
        // 설정 요소들
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        
        // 목록 관련 요소들
        this.addListBtn = document.getElementById('addListBtn');
        this.listContextMenu = document.getElementById('listContextMenu');
        
        // 디버깅: listContextMenu 요소 확인
        console.log('listContextMenu element:', this.listContextMenu);

        // 캘린더 요소들
        this.calendarBtn = document.getElementById('calendarBtn');
        this.calendarView = document.getElementById('calendarView');
        this.todoListView = document.getElementById('todoListView');
        this.currentMonthYear = document.getElementById('currentMonthYear');
        this.calendarDays = document.getElementById('calendarDays');
        this.prevMonth = document.getElementById('prevMonth');
        this.nextMonth = document.getElementById('nextMonth');
        this.todayBtn = document.getElementById('todayBtn');

        // 모바일 요소들
        this.sidebar = document.getElementById('sidebar');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        this.header = document.querySelector('header');
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

        // 캘린더 체크박스 이벤트 - 시작일 필드 표시/숨김
        this.sideCalendar.addEventListener('change', () => {
            if (this.sideCalendar.checked) {
                this.calendarDateFields.style.display = 'block';
            } else {
                this.calendarDateFields.style.display = 'none';
                this.sideStartDate.value = '';
            }
        });

        // 사이드바 메뉴 이벤트
        this.sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.currentTarget.dataset.filter;
                this.setSidebarFilter(filter);
            });
        });
        
        // 검색 및 정렬 이벤트
        this.bindSearchSortEvents();
        
        // 설정 이벤트
        this.bindSettingsEvents();
        
        // 모바일 이벤트
        this.bindMobileEvents();
        
        // 컨텍스트 메뉴 이벤트
        this.bindContextMenuEvents();
        
        // 날짜 선택 모달 이벤트
        this.bindDateModalEvents();

        // 캘린더 이벤트
        this.bindCalendarEvents();

        // 전역 클릭 이벤트 (컨텍스트 메뉴 닫기)
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // 할일 목록에 우클릭 이벤트 바인딩
        document.addEventListener('contextmenu', (e) => {
            // 목록 링크인 경우 개별 이벤트 핸들러에서 처리하므로 여기서는 제외
            const listLink = e.target.closest('.list-link');
            if (listLink) {
                return; // 목록 링크는 개별 핸들러에서 처리
            }

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

    // 다음 목록 ID 생성
    getNextListId() {
        return this.lists.length > 0 ? Math.max(...this.lists.map(l => l.id)) + 1 : 1;
    }

    // 빠른 할 일 추가
    addQuickTodo() {
        const rawText = this.todoInput.value;
        const text = this.sanitizeInput(rawText);

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
            isImportant: false,
            showInCalendar: false,
            listId: this.currentList
        };

        this.todos.unshift(newTodo);
        this.saveTodos();
        this.render();
        this.updateSidebarCounts();
        this.renderLists();

        this.todoInput.value = '';
        this.todoInput.focus();

        this.showNotification('할 일이 추가되었습니다!', 'success');
    }

    // 사이드 패널 열기
    openSidePanel(mode, todoId = null) {
        this.currentEditingId = todoId;
        this.attachedFiles = [];

        // 목록 옵션을 업데이트
        this.populateListOptions();

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
        this.sideList.value = this.currentList || 1; // 현재 선택된 목록 또는 기본 목록
        this.sidePriority.value = 'medium';
        this.sideDueDate.value = '';
        this.sideRepeat.value = 'none';
        this.sideImportant.checked = false;
        this.sideCalendar.checked = false;
        this.sideStartDate.value = '';
        this.calendarDateFields.style.display = 'none';
        this.sideFiles.value = '';
        this.sideMemo.value = '';
        this.sideCharCount.textContent = '0';
        // Clear file list safely
        while (this.fileList.firstChild) {
            this.fileList.removeChild(this.fileList.firstChild);
        }
        this.attachedFiles = [];
    }

    // 사이드 폼 채우기
    fillSideForm(todo) {
        this.sideTitle.value = todo.text;
        this.sideList.value = todo.listId || 1; // 기본 목록(1) 또는 할당된 목록
        this.sidePriority.value = todo.priority;
        this.sideDueDate.value = todo.dueDate || '';
        this.sideRepeat.value = todo.repeat || 'none';
        this.sideImportant.checked = todo.isImportant || false;
        this.sideCalendar.checked = todo.showInCalendar || false;
        this.sideStartDate.value = todo.startDate || '';

        // 캘린더 체크 시 시작일 필드 표시
        if (todo.showInCalendar) {
            this.calendarDateFields.style.display = 'block';
        } else {
            this.calendarDateFields.style.display = 'none';
        }

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
        // Clear existing content safely
        while (this.fileList.firstChild) {
            this.fileList.removeChild(this.fileList.firstChild);
        }
        
        this.attachedFiles.forEach((file) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.setAttribute('data-file-id', file.id);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            fileIcon.textContent = this.getFileIcon(file.type);
            
            const fileDetails = document.createElement('div');
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = this.formatFileSize(file.size);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file';
            removeBtn.setAttribute('data-file-id', file.id);
            removeBtn.textContent = '삭제';
            removeBtn.addEventListener('click', (e) => {
                const fileId = e.target.getAttribute('data-file-id');
                this.removeFile(fileId);
            });
            
            fileDetails.appendChild(fileName);
            fileDetails.appendChild(fileSize);
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileDetails);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            this.fileList.appendChild(fileItem);
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
        const newText = this.sanitizeInput(this.sideTitle.value);
        const newListId = parseInt(this.sideList.value);
        const newPriority = this.sidePriority.value;
        const newDueDate = this.sideDueDate.value || null;
        const newRepeat = this.sideRepeat.value;
        const newImportant = this.sideImportant.checked;
        const newCalendar = this.sideCalendar.checked;
        const newStartDate = this.sideStartDate.value || null;
        const newMemo = this.sanitizeInput(this.sideMemo.value);

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
                todo.listId = newListId;
                todo.priority = newPriority;
                todo.dueDate = newDueDate;
                todo.repeat = newRepeat;
                todo.isImportant = newImportant;
                todo.showInCalendar = newCalendar;
                todo.startDate = newStartDate;
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
                listId: newListId,
                priority: newPriority,
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: newDueDate,
                startDate: newStartDate,
                memo: newMemo,
                repeat: newRepeat,
                files: [...this.attachedFiles],
                isMyDay: false,
                isImportant: newImportant,
                showInCalendar: newCalendar
            };

            this.todos.unshift(newTodo);
            this.showNotification('할 일이 추가되었습니다!', 'success');
        }

        this.saveTodos();
        this.render();
        this.updateSidebarCounts();
        this.renderLists();

        // 캘린더 뷰가 활성화되어 있으면 다시 렌더링
        if (this.isCalendarView) {
            this.renderCalendar();
        }

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
            this.renderLists();
            
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
                    nextRecurrenceDate: null,
                    listId: todo.listId
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
            this.renderLists();
            
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
            this.renderLists();
            
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
            this.renderLists();
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
            this.renderLists();
            this.showNotification('모든 할 일이 삭제되었습니다.', 'success');
        }
    }

    // 사이드바 필터 설정
    setSidebarFilter(filter) {
        this.currentFilter = filter;
        this.currentList = null; // 필터 선택시 목록 선택 해제

        // 캘린더 뷰가 활성화되어 있으면 리스트 뷰로 전환
        if (this.isCalendarView) {
            this.isCalendarView = false;
            this.todoListView.style.display = 'block';
            this.calendarView.style.display = 'none';
            this.calendarBtn.classList.remove('active');
        }

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
        const all = this.todos.filter(t => !t.completed).length;
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

        // 현재 목록 필터
        if (this.currentList) {
            filtered = filtered.filter(t => t.listId === this.currentList);
        }

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

        // 검색 필터 - 검색 시에는 모든 필터 무시하고 전체 할일에서 검색
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            
            // 검색 시에는 모든 할일에서 검색 (모든 필터 무시)
            filtered = this.todos.filter(todo => {
                return todo.text.toLowerCase().includes(query) ||
                       (todo.memo && todo.memo.toLowerCase().includes(query)) ||
                       this.getPriorityText(todo.priority).toLowerCase().includes(query) ||
                       (todo.dueDate && todo.dueDate.includes(query));
            });
        }

        // 정렬 적용
        filtered = this.applySorting(filtered);

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
            // Clear todo list safely
            while (this.todoList.firstChild) {
                this.todoList.removeChild(this.todoList.firstChild);
            }
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            // Clear and rebuild todo list safely
            while (this.todoList.firstChild) {
                this.todoList.removeChild(this.todoList.firstChild);
            }
            pendingTodos.forEach(todo => {
                const todoElement = this.createTodoElement(todo);
                this.todoList.appendChild(todoElement);
            });
        }
        
        // 완료된 할일 섹션 처리
        if (allCompletedTodos.length > 0) {
            this.completedSection.style.display = 'block';
            this.completedSectionCount.textContent = allCompletedTodos.length;
            // Clear and rebuild completed todo list safely
            while (this.completedTodoList.firstChild) {
                this.completedTodoList.removeChild(this.completedTodoList.firstChild);
            }
            allCompletedTodos.forEach(todo => {
                const todoElement = this.createTodoElement(todo);
                this.completedTodoList.appendChild(todoElement);
            });
        } else {
            this.completedSection.style.display = 'none';
        }
    }

    // 할일 아이템 생성 함수 (안전한 DOM 조작)
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        
        // Todo content
        const todoContent = document.createElement('div');
        todoContent.className = 'todo-content clickable';
        todoContent.addEventListener('click', () => this.openSidePanel('edit', todo.id));
        
        // Main row
        const mainRow = document.createElement('div');
        mainRow.className = 'todo-main-row';
        
        const todoText = document.createElement('span');
        todoText.className = 'todo-text';
        if (this.searchQuery.trim()) {
            this.setHighlightedText(todoText, todo.text, this.searchQuery);
        } else {
            todoText.textContent = todo.text;
        }
        
        const importantIndicator = document.createElement('span');
        importantIndicator.className = `important-indicator ${todo.isImportant ? 'active' : ''}`;
        importantIndicator.title = todo.isImportant ? '중요 표시 해제' : '중요로 표시';
        importantIndicator.textContent = todo.isImportant ? '★' : '☆';
        importantIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleImportant(todo.id);
        });
        
        mainRow.appendChild(todoText);
        mainRow.appendChild(importantIndicator);
        
        // Meta row
        const metaRow = document.createElement('div');
        metaRow.className = 'todo-meta';

        // List badge (목록 배지를 제일 앞에 추가)
        if (todo.listId) {
            const list = this.lists.find(l => l.id === todo.listId);
            if (list) {
                const listBadge = document.createElement('span');
                listBadge.className = 'list-badge';
                listBadge.style.backgroundColor = list.color || '#0078d4';
                listBadge.textContent = list.icon ? `${list.icon} ${list.name}` : list.name;
                listBadge.title = `목록: ${list.name}`;
                metaRow.appendChild(listBadge);
            }
        }

        // Due date
        if (this.settings.showDueDates && todo.dueDate) {
            const dueDateElement = this.createDueDateElement(todo.dueDate);
            metaRow.appendChild(dueDateElement);
        }
        
        // Repeat indicator
        if (todo.repeat !== 'none') {
            const repeatSpan = document.createElement('span');
            repeatSpan.className = 'repeat-indicator';
            repeatSpan.title = `반복: ${this.getRepeatText(todo.repeat)}`;
            repeatSpan.textContent = '🔄';
            metaRow.appendChild(repeatSpan);
        }
        
        // Attachment indicator
        if (todo.files && todo.files.length > 0) {
            const attachmentSpan = document.createElement('span');
            attachmentSpan.className = 'attachment-indicator';
            attachmentSpan.title = `${todo.files.length}개 파일 첨부`;
            attachmentSpan.textContent = '📎';
            metaRow.appendChild(attachmentSpan);
        }
        
        // Memo indicator
        if (todo.memo) {
            const memoSpan = document.createElement('span');
            memoSpan.className = 'memo-indicator';
            memoSpan.title = '메모 있음';
            memoSpan.textContent = '📝';
            metaRow.appendChild(memoSpan);
        }
        
        // Priority badge
        if (this.settings.showPriority) {
            const prioritySpan = document.createElement('span');
            prioritySpan.className = `priority-badge priority-${todo.priority}`;
            prioritySpan.textContent = this.getPriorityText(todo.priority);
            metaRow.appendChild(prioritySpan);
        }
        
        todoContent.appendChild(mainRow);
        todoContent.appendChild(metaRow);
        
        li.appendChild(checkbox);
        li.appendChild(todoContent);
        
        return li;
    }

    // 마감일 요소 생성 함수
    createDueDateElement(dueDate) {
        if (!dueDate) return null;
        
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
        
        const span = document.createElement('span');
        span.className = `due-date ${className}`;
        span.textContent = `📅 ${text}`;
        return span;
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
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 강화된 입력 검증 및 정리
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove potential script tags and dangerous content
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
            .slice(0, 1000); // Limit length to prevent DoS
    }

    // 안전한 검색 쿼리 검증
    validateSearchQuery(query) {
        if (typeof query !== 'string') return '';
        
        // Remove dangerous patterns and limit length
        return query
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .trim()
            .slice(0, 100);
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

    // 로컬 스토리지에서 목록 불러오기
    loadLists() {
        try {
            const saved = localStorage.getItem('lists');
            const lists = saved ? JSON.parse(saved) : [];
            
            // 기본 목록이 없으면 생성
            if (lists.length === 0) {
                const defaultList = {
                    id: 1,
                    name: 'Personal',
                    icon: '📋',
                    color: '#0078d4',
                    createdAt: new Date().toISOString()
                };
                lists.push(defaultList);
                this.saveLists(lists);
            }

            return lists;
        } catch (error) {
            console.error('목록을 불러오는 중 오류 발생:', error);
            return [{
                id: 1,
                name: 'Personal',
                icon: '📋',
                color: '#0078d4',
                createdAt: new Date().toISOString()
            }];
        }
    }

    // 로컬 스토리지에 목록 저장
    saveLists(lists = null) {
        try {
            const listsToSave = lists || this.lists;
            localStorage.setItem('lists', JSON.stringify(listsToSave));
            if (!lists) {
                this.renderLists();
            }
        } catch (error) {
            console.error('목록을 저장하는 중 오류 발생:', error);
            this.showNotification('목록 저장 중 오류가 발생했습니다.', 'error');
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

    // 캘린더 이벤트 바인딩
    bindCalendarEvents() {
        // 캘린더 버튼 클릭
        this.calendarBtn.addEventListener('click', () => {
            this.toggleCalendarView();
        });

        // 이전 달 버튼
        this.prevMonth.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });

        // 다음 달 버튼
        this.nextMonth.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });

        // 오늘 버튼
        this.todayBtn.addEventListener('click', () => {
            const today = new Date();
            this.currentMonth = today.getMonth();
            this.currentYear = today.getFullYear();
            this.renderCalendar();
        });
    }

    // 캘린더 뷰 토글
    toggleCalendarView() {
        this.isCalendarView = !this.isCalendarView;

        if (this.isCalendarView) {
            this.todoListView.style.display = 'none';
            this.calendarView.style.display = 'block';
            this.calendarBtn.classList.add('active');
            this.renderCalendar();
        } else {
            this.todoListView.style.display = 'block';
            this.calendarView.style.display = 'none';
            this.calendarBtn.classList.remove('active');
        }
    }

    // 캘린더 렌더링
    renderCalendar() {
        // 월/년 표시
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        this.currentMonthYear.textContent = `${this.currentYear}년 ${monthNames[this.currentMonth]}`;

        // 해당 월의 첫날과 마지막 날
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

        // 첫 주의 시작 (일요일부터 시작)
        const startingDayOfWeek = firstDay.getDay();

        // 캘린더 그리드 초기화
        this.calendarDays.innerHTML = '';

        // 이전 달의 날짜들
        const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayDiv = this.createCalendarDay(prevMonthLastDay - i, true, false);
            this.calendarDays.appendChild(dayDiv);
        }

        // 현재 달의 날짜들
        const today = new Date();
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const isToday = today.getDate() === day &&
                           today.getMonth() === this.currentMonth &&
                           today.getFullYear() === this.currentYear;
            const dayDiv = this.createCalendarDay(day, false, isToday);
            this.calendarDays.appendChild(dayDiv);
        }

        // 다음 달의 날짜들
        const remainingDays = 42 - this.calendarDays.children.length; // 6주 * 7일
        for (let day = 1; day <= remainingDays; day++) {
            const dayDiv = this.createCalendarDay(day, true, false);
            this.calendarDays.appendChild(dayDiv);
        }
    }

    // 캘린더 날짜 셀 생성
    createCalendarDay(day, isOtherMonth, isToday) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        if (isOtherMonth) {
            dayDiv.classList.add('other-month');
        }

        if (isToday) {
            dayDiv.classList.add('today');
        }

        // 요일 클래스 추가 (일요일/토요일)
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) {
            dayDiv.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            dayDiv.classList.add('saturday');
        }

        // 날짜 번호
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        // 해당 날짜의 할일 표시
        if (!isOtherMonth) {
            const todosContainer = document.createElement('div');
            todosContainer.className = 'calendar-todos';

            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // 해당 날짜가 시작일과 마감일 사이에 있는 할일 필터링
            const todosForDate = this.todos.filter(todo => {
                if (!todo.showInCalendar) return false;

                // 시작일과 마감일이 모두 있는 경우
                if (todo.startDate && todo.dueDate) {
                    return dateStr >= todo.startDate && dateStr <= todo.dueDate;
                }

                // 마감일만 있는 경우 (기존 로직)
                if (todo.dueDate) {
                    return todo.dueDate.startsWith(dateStr);
                }

                return false;
            });

            // 최대 3개까지 표시
            const displayCount = Math.min(3, todosForDate.length);
            for (let i = 0; i < displayCount; i++) {
                const todo = todosForDate[i];
                const todoItem = document.createElement('div');
                todoItem.className = 'calendar-todo-item';

                if (todo.completed) {
                    todoItem.classList.add('completed');
                } else if (todo.priority === 'high') {
                    todoItem.classList.add('priority-high');
                } else if (todo.priority === 'low') {
                    todoItem.classList.add('priority-low');
                }

                // 연속된 일정인지 확인하고 위치 클래스 추가
                if (todo.startDate && todo.dueDate && todo.startDate !== todo.dueDate) {
                    if (dateStr === todo.startDate) {
                        todoItem.classList.add('range-start');
                    } else if (dateStr === todo.dueDate) {
                        todoItem.classList.add('range-end');
                    } else {
                        todoItem.classList.add('range-middle');
                    }
                }

                todoItem.textContent = todo.text;
                todoItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openTodoDetail(todo.id);
                });

                todosContainer.appendChild(todoItem);
            }

            // 더 많은 할일이 있으면 표시
            if (todosForDate.length > 3) {
                const moreDiv = document.createElement('div');
                moreDiv.className = 'calendar-more-todos';
                moreDiv.textContent = `+${todosForDate.length - 3} 더보기`;
                todosContainer.appendChild(moreDiv);
            }

            dayDiv.appendChild(todosContainer);
        }

        return dayDiv;
    }

    // 할일 상세 열기
    openTodoDetail(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            this.openSidePanel('edit', todoId);
        }
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
            // Clear existing content
            while (importantItem.firstChild) {
                importantItem.removeChild(importantItem.firstChild);
            }

            const iconSpan = document.createElement('span');
            iconSpan.className = 'context-icon';
            iconSpan.textContent = '⭐';

            const textNode = document.createTextNode(
                todo.isImportant ? '중요 표시 해제' : '중요로 표시'
            );

            importantItem.appendChild(iconSpan);
            importantItem.appendChild(textNode);
        }

        // 완료됨으로 표시/해제 텍스트 변경
        const completedItem = this.contextMenu.querySelector('[data-action="markCompleted"]');
        if (completedItem) {
            // Clear existing content
            while (completedItem.firstChild) {
                completedItem.removeChild(completedItem.firstChild);
            }

            const iconSpan = document.createElement('span');
            iconSpan.className = 'context-icon';
            iconSpan.textContent = '✅';

            const textNode = document.createTextNode(
                todo.completed ? '미완료로 표시' : '완료됨으로 표시'
            );

            completedItem.appendChild(iconSpan);
            completedItem.appendChild(textNode);
        }

        // 나의 하루 추가/제거 텍스트 변경
        const myDayItem = this.contextMenu.querySelector('[data-action="addToMyDay"]');
        if (myDayItem) {
            // Clear existing content
            while (myDayItem.firstChild) {
                myDayItem.removeChild(myDayItem.firstChild);
            }

            const iconSpan = document.createElement('span');
            iconSpan.className = 'context-icon';
            iconSpan.textContent = '☀️';

            const textNode = document.createTextNode(
                todo.isMyDay ? '나의 하루에서 제거' : '나의 하루 추가'
            );

            myDayItem.appendChild(iconSpan);
            myDayItem.appendChild(textNode);
        }

        // 캘린더 추가/제거 텍스트 변경
        const calendarItem = this.contextMenu.querySelector('[data-action="toggleCalendar"]');
        if (calendarItem) {
            // Clear existing content
            while (calendarItem.firstChild) {
                calendarItem.removeChild(calendarItem.firstChild);
            }

            const iconSpan = document.createElement('span');
            iconSpan.className = 'context-icon';
            iconSpan.textContent = '📅';

            const textSpan = document.createElement('span');
            textSpan.className = 'calendar-toggle-text';
            textSpan.textContent = todo.showInCalendar ? '캘린더에서 제거' : '캘린더에 추가';

            calendarItem.appendChild(iconSpan);
            calendarItem.appendChild(textSpan);
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
            case 'toggleCalendar':
                this.toggleTodoCalendar(todoId);
                break;
            case 'delete':
                this.deleteTodo(todoId);
                break;
        }
    }

    // 할일의 캘린더 표시 토글
    toggleTodoCalendar(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.showInCalendar = !todo.showInCalendar;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();

            // 캘린더 뷰가 열려있으면 다시 렌더링
            if (this.isCalendarView) {
                this.renderCalendar();
            }

            const message = todo.showInCalendar
                ? '캘린더에 추가되었습니다.'
                : '캘린더에서 제거되었습니다.';
            this.showNotification(message, 'success');
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

    // 목록 렌더링
    renderLists() {
        const sidebarMenu = document.querySelector('.sidebar-menu');
        const existingListItems = sidebarMenu.querySelectorAll('.list-item');
        existingListItems.forEach(item => item.remove());


        // 구분선 추가
        let separator = sidebarMenu.querySelector('.lists-separator');
        if (!separator) {
            const separatorItem = document.createElement('li');
            separatorItem.className = 'sidebar-separator lists-separator';
            
            const hr = document.createElement('hr');
            hr.style.border = '1px solid #3c3c3c';
            hr.style.margin = '8px 16px';
            separatorItem.appendChild(hr);
            
            sidebarMenu.appendChild(separatorItem);
        }

        // 각 목록 항목 추가
        this.lists.forEach(list => {
            const listItem = document.createElement('li');
            listItem.className = 'sidebar-item list-item';
            
            const todosInList = this.todos.filter(t => t.listId === list.id);
            const count = todosInList.filter(t => !t.completed).length;
            
            const link = document.createElement('a');
            link.href = '#';
            link.className = `sidebar-link list-link ${this.currentList === list.id ? 'active' : ''}`;
            link.setAttribute('data-list-id', list.id);
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'sidebar-icon';
            iconSpan.style.color = list.color;
            iconSpan.textContent = list.icon;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'sidebar-text';
            textSpan.textContent = list.name;
            
            const countSpan = document.createElement('span');
            countSpan.className = 'sidebar-count';
            countSpan.textContent = count;
            
            link.appendChild(iconSpan);
            link.appendChild(textSpan);
            link.appendChild(countSpan);
            listItem.appendChild(link);
            
            sidebarMenu.appendChild(listItem);
            
            // Add event listeners to the already created link
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectList(list.id);
            });
            
            // 우클릭 이벤트 추가
            link.addEventListener('contextmenu', (e) => {
                console.log('Right click on list:', list.id, list.name);
                e.preventDefault();
                e.stopPropagation(); // 이벤트 전파 방지
                this.showListContextMenu(e.pageX, e.pageY, list.id);
            });
        });
    }

    // 목록 선택
    selectList(listId) {
        this.currentList = listId;
        this.currentFilter = 'all'; // 기본 필터로 설정

        // 캘린더 뷰가 활성화되어 있으면 리스트 뷰로 전환
        if (this.isCalendarView) {
            this.isCalendarView = false;
            this.todoListView.style.display = 'block';
            this.calendarView.style.display = 'none';
            this.calendarBtn.classList.remove('active');
        }

        // 사이드바 링크 업데이트
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });

        const selectedLink = document.querySelector(`[data-list-id="${listId}"]`);
        if (selectedLink) {
            selectedLink.classList.add('active');
        }

        // 기본 필터 링크도 비활성화
        document.querySelectorAll('[data-filter]').forEach(link => {
            link.classList.remove('active');
        });

        // 페이지 제목 업데이트
        const selectedList = this.lists.find(l => l.id === listId);
        if (selectedList) {
            const header = document.querySelector('header h1');
            if (header) {
                header.textContent = `${selectedList.icon} ${selectedList.name}`;
            }
        }
        
        this.render();
        this.updateSidebarCounts();
    }

    // 목록 모달 표시
    showListModal(editList = null) {
        const modalHTML = `
            <div id="listModal" class="modal show">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${editList ? '목록 수정' : '새 목록 추가'}</h2>
                        <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="listName">목록 이름 *</label>
                            <input type="text" id="listName" value="${editList ? editList.name : ''}" maxlength="50" required>
                        </div>
                        <div class="form-group">
                            <label for="listIcon">아이콘</label>
                            <div class="icon-grid">
                                ${['📋', '📝', '💼', '🏠', '🛒', '🎯', '💡', '🔔', '⭐', '🚀', '💪', '🎨', '📚', '🎵', '🎮', '🌟'].map(icon => 
                                    `<div class="icon-option ${editList && editList.icon === icon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="listColor">색상</label>
                            <div class="color-grid">
                                ${['#0078d4', '#ff6b6b', '#51cf66', '#ffd93d', '#9c88ff', '#20bf6b', '#fd79a8', '#6c757d', '#e84393', '#00b894'].map(color => 
                                    `<div class="color-option ${editList && editList.color === color ? 'selected' : ''}" data-color="${color}" style="background-color: ${color}"></div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
                        <button class="btn btn-primary" onclick="todoManager.saveList(${editList ? editList.id : 'null'})">${editList ? '수정' : '추가'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 아이콘 선택 이벤트
        document.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // 색상 선택 이벤트
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // 기본값 설정
        if (!editList) {
            document.querySelector('.icon-option[data-icon="📋"]').classList.add('selected');
            document.querySelector('.color-option[data-color="#0078d4"]').classList.add('selected');
        }
        
        document.getElementById('listName').focus();
    }

    // 목록 저장
    saveList(editId = null) {
        const nameInput = document.getElementById('listName');
        const selectedIcon = document.querySelector('.icon-option.selected');
        const selectedColor = document.querySelector('.color-option.selected');
        
        const name = this.sanitizeInput(nameInput.value);
        
        if (!name) {
            this.showNotification('목록 이름을 입력해주세요!', 'error');
            nameInput.focus();
            return;
        }
        
        const icon = selectedIcon ? selectedIcon.dataset.icon : '📋';
        const color = selectedColor ? selectedColor.dataset.color : '#0078d4';
        
        if (editId) {
            // 수정 모드
            const list = this.lists.find(l => l.id === editId);
            if (list) {
                list.name = name;
                list.icon = icon;
                list.color = color;
                list.updatedAt = new Date().toISOString();
                this.showNotification('목록이 수정되었습니다!', 'success');
            }
        } else {
            // 추가 모드
            const newList = {
                id: this.nextListId++,
                name: name,
                icon: icon,
                color: color,
                createdAt: new Date().toISOString()
            };
            
            this.lists.push(newList);
            this.showNotification('새 목록이 추가되었습니다!', 'success');
        }
        
        this.saveLists();
        document.getElementById('listModal').remove();
    }

    // 목록 관리 화면 표시
    showListManagement() {
        const modalHTML = `
            <div id="listManagementModal" class="modal show">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>📋 목록 관리</h2>
                        <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="list-management-grid">
                            ${this.lists.map(list => {
                                const todosInList = this.todos.filter(t => t.listId === list.id);
                                const pendingCount = todosInList.filter(t => !t.completed).length;
                                const completedCount = todosInList.filter(t => t.completed).length;
                                
                                return `
                                    <div class="list-management-item">
                                        <div class="list-info">
                                            <div class="list-header">
                                                <span class="list-icon" style="color: ${list.color}">${list.icon}</span>
                                                <h3>${this.escapeHtml(list.name)}</h3>
                                            </div>
                                            <div class="list-stats">
                                                <span class="stat">할 일: ${pendingCount}개</span>
                                                <span class="stat">완료: ${completedCount}개</span>
                                            </div>
                                            <div class="list-date">
                                                생성일: ${new Date(list.createdAt).toLocaleDateString('ko-KR')}
                                            </div>
                                        </div>
                                        <div class="list-actions">
                                            <button class="btn btn-secondary" onclick="todoManager.editList(${list.id})">수정</button>
                                            <button class="btn btn-danger" onclick="todoManager.deleteList(${list.id})" ${list.id === 1 ? 'disabled title="기본 목록은 삭제할 수 없습니다"' : ''}>삭제</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn btn-primary" onclick="todoManager.showListModal();">➕ 새 목록 추가</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">닫기</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 목록 수정
    editList(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            const existingModal = document.getElementById('listManagementModal');
            if (existingModal) {
                existingModal.remove();
            }
            this.showListModal(list);
        }
    }

    // 목록 삭제
    deleteList(listId) {
        if (listId === 1) {
            this.showNotification('기본 목록은 삭제할 수 없습니다.', 'error');
            return;
        }
        
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;
        
        const todosInList = this.todos.filter(t => t.listId === listId);
        
        let confirmMessage = `"${list.name}" 목록을 삭제하시겠습니까?`;
        if (todosInList.length > 0) {
            confirmMessage += `\n\n이 목록에는 ${todosInList.length}개의 할 일이 있습니다. 모든 할 일도 함께 삭제됩니다.`;
        }
        
        if (confirm(confirmMessage)) {
            // 목록의 모든 할 일 삭제
            this.todos = this.todos.filter(t => t.listId !== listId);
            
            // 목록 삭제
            this.lists = this.lists.filter(l => l.id !== listId);
            
            // 현재 선택된 목록이 삭제된 경우 기본 목록으로 변경
            if (this.currentList === listId) {
                this.currentList = 1;
                this.selectList(1);
            }
            
            this.saveLists();
            this.saveTodos();
            this.render();
            this.updateSidebarCounts();
            
            document.getElementById('listManagementModal').remove();
            this.showNotification('목록이 삭제되었습니다.', 'success');
        }
    }

    // 검색 및 정렬 이벤트 바인딩
    bindSearchSortEvents() {
        // 사이드바 검색 입력 이벤트
        this.sidebarSearchInput.addEventListener('input', (e) => {
            this.searchQuery = this.validateSearchQuery(e.target.value);
            this.updateClearSearchButton();
            this.render();
        });
        
        // 사이드바 검색 지우기 버튼
        this.clearSidebarSearch.addEventListener('click', () => {
            this.sidebarSearchInput.value = '';
            this.searchQuery = '';
            this.updateClearSearchButton();
            this.render();
            this.sidebarSearchInput.focus();
        });
        
        // 정렬 방식 변경
        this.sortSelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.render();
        });
        
        // 정렬 순서 토글
        this.toggleSortOrder.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.updateSortOrderButton();
            this.render();
        });
        
        // 키보드 단축키 (Ctrl+F로 검색 포커스)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.sidebarSearchInput.focus();
                this.sidebarSearchInput.select();
            }
        });
    }
    
    // 검색 지우기 버튼 업데이트
    updateClearSearchButton() {
        if (this.searchQuery.trim()) {
            this.clearSidebarSearch.style.display = 'block';
        } else {
            this.clearSidebarSearch.style.display = 'none';
        }
    }
    
    // 정렬 순서 버튼 업데이트
    updateSortOrderButton() {
        this.toggleSortOrder.textContent = this.sortOrder === 'asc' ? '⬆️' : '⬇️';
        this.toggleSortOrder.title = this.sortOrder === 'asc' ? '오름차순' : '내림차순';
    }
    
    // 정렬 적용
    applySorting(todos) {
        const sorted = [...todos];
        
        switch (this.sortBy) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority':
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            case 'dueDate':
                sorted.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'alphabetical':
                sorted.sort((a, b) => a.text.localeCompare(b.text, 'ko'));
                break;
            case 'completed':
                sorted.sort((a, b) => {
                    if (a.completed === b.completed) return 0;
                    return a.completed ? 1 : -1;
                });
                break;
        }
        
        // 정렬 순서 적용 (완료상태순은 제외)
        if (this.sortOrder === 'desc' && this.sortBy !== 'completed') {
            sorted.reverse();
        }
        
        return sorted;
    }
    
    // 안전한 검색 하이라이트 (DOM 조작 방식)
    setHighlightedText(element, text, searchQuery) {
        if (!searchQuery.trim()) {
            element.textContent = text;
            return;
        }
        
        const query = this.validateSearchQuery(searchQuery);
        if (!query) {
            element.textContent = text;
            return;
        }
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        // Clear element
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        
        for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
                if (regex.test(parts[i])) {
                    const mark = document.createElement('mark');
                    mark.className = 'search-highlight';
                    mark.textContent = parts[i];
                    element.appendChild(mark);
                } else {
                    const textNode = document.createTextNode(parts[i]);
                    element.appendChild(textNode);
                }
            }
        }
    }

    // Legacy method for compatibility (now safe)
    highlightSearchTerm(text) {
        if (!this.searchQuery.trim()) return this.escapeHtml(text);
        
        const escapedText = this.escapeHtml(text);
        const escapedQuery = this.escapeHtml(this.searchQuery.trim());
        const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        
        return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    
    // 설정 이벤트 바인딩
    bindSettingsEvents() {
        // 설정 버튼 클릭
        this.settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });
        
        // 테마 선택
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-option')) {
                const themeBtn = e.target.closest('.theme-option');
                const theme = themeBtn.dataset.theme;
                this.changeTheme(theme);
                
                document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
                themeBtn.classList.add('active');
            }
        });
        
        // 강조 색상 선택
        document.addEventListener('click', (e) => {
            if (e.target.closest('.accent-colors .color-option')) {
                const colorBtn = e.target.closest('.color-option');
                const color = colorBtn.dataset.color;
                this.changeAccentColor(color);
                
                document.querySelectorAll('.accent-colors .color-option').forEach(btn => btn.classList.remove('active'));
                colorBtn.classList.add('active');
            }
        });
        
        // 설정 체크박스 변경
        ['showCompletedCount', 'showDueDates', 'showPriority', 'enableNotifications', 'enableSounds'].forEach(settingId => {
            const checkbox = document.getElementById(settingId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateSetting(settingId, checkbox.checked);
                });
            }
        });
    }
    
    // 모바일 이벤트 바인딩
    bindMobileEvents() {
        // 헤더 햄버거 메뉴 클릭 (::before pseudo-element는 직접 이벤트를 받을 수 없으므로 헤더 영역 클릭으로 처리)
        if (this.header) {
            this.header.addEventListener('click', (e) => {
                // 헤더의 왼쪽 50px 영역 클릭시 사이드바 토글
                const rect = this.header.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                
                if (clickX <= 50 && window.innerWidth <= 1024) {
                    e.preventDefault();
                    this.toggleMobileSidebar();
                }
            });
        }
        
        // 모바일 오버레이 클릭시 사이드바 닫기
        if (this.mobileOverlay) {
            this.mobileOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
        
        // 사이드바 링크 클릭시 모바일에서 사이드바 닫기
        this.sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
            });
        });
        
        // 윈도우 리사이즈시 사이드바 상태 초기화
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                this.closeMobileSidebar();
            }
        });
        
        // 터치 이벤트 개선 (스와이프로 사이드바 닫기)
        let touchStartX = 0;
        let touchStartY = 0;
        
        if (this.sidebar) {
            this.sidebar.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            
            this.sidebar.addEventListener('touchmove', (e) => {
                if (!touchStartX) return;
                
                const touchCurrentX = e.touches[0].clientX;
                const touchCurrentY = e.touches[0].clientY;
                
                const diffX = touchStartX - touchCurrentX;
                const diffY = Math.abs(touchStartY - touchCurrentY);
                
                // 수평 스와이프가 수직 스와이프보다 클 때만 처리
                if (Math.abs(diffX) > diffY && Math.abs(diffX) > 50) {
                    if (diffX > 0 && window.innerWidth <= 768) {
                        // 왼쪽으로 스와이프시 사이드바 닫기
                        this.closeMobileSidebar();
                    }
                }
                
                touchStartX = 0;
                touchStartY = 0;
            });
        }
    }
    
    // 모바일 사이드바 토글
    toggleMobileSidebar() {
        if (this.sidebar && this.sidebar.classList.contains('open')) {
            this.closeMobileSidebar();
        } else {
            this.openMobileSidebar();
        }
    }
    
    // 모바일 사이드바 열기
    openMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.classList.add('show');
        }
        // 스크롤 방지
        document.body.style.overflow = 'hidden';
    }
    
    // 모바일 사이드바 닫기
    closeMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.classList.remove('show');
        }
        // 스크롤 복원
        document.body.style.overflow = '';
    }
    
    // 설정 로드
    loadSettings() {
        try {
            const saved = localStorage.getItem('settings');
            const defaultSettings = {
                theme: 'dark',
                accentColor: '#0078d4',
                showCompletedCount: true,
                showDueDates: true,
                showPriority: true,
                enableNotifications: true,
                enableSounds: true
            };
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('설정을 불러오는 중 오류 발생:', error);
            return {
                theme: 'dark',
                accentColor: '#0078d4',
                showCompletedCount: true,
                showDueDates: true,
                showPriority: true,
                enableNotifications: true,
                enableSounds: true
            };
        }
    }
    
    // 설정 저장
    saveSettings() {
        try {
            localStorage.setItem('settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('설정을 저장하는 중 오류 발생:', error);
        }
    }
    
    // 설정 모달 표시
    showSettings() {
        this.settingsModal.classList.add('show');
        
        // 현재 설정값으로 UI 업데이트
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
        
        document.querySelectorAll('.accent-colors .color-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.accentColor);
        });
        
        // 체크박스 상태 업데이트
        ['showCompletedCount', 'showDueDates', 'showPriority', 'enableNotifications', 'enableSounds'].forEach(settingId => {
            const checkbox = document.getElementById(settingId);
            if (checkbox) {
                checkbox.checked = this.settings[settingId];
            }
        });
    }
    
    // 설정 적용
    applySettings() {
        this.changeTheme(this.settings.theme);
        this.changeAccentColor(this.settings.accentColor);
        
        // 알림 권한 요청
        if (this.settings.enableNotifications && 'Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    // 테마 변경
    changeTheme(theme) {
        this.settings.theme = theme;
        document.body.className = theme === 'light' ? 'light-theme' : '';
        this.saveSettings();
    }
    
    // 강조 색상 변경
    changeAccentColor(color) {
        this.settings.accentColor = color;
        document.documentElement.style.setProperty('--accent-color', color);
        this.saveSettings();
    }
    
    // 설정 업데이트
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        if (key === 'enableNotifications' && value && 'Notification' in window) {
            Notification.requestPermission();
        }
        
        // 표시 설정 변경 시 UI 업데이트
        if (['showCompletedCount', 'showDueDates', 'showPriority'].includes(key)) {
            this.render();
        }
    }
    
    // 데이터 내보내기
    exportData() {
        try {
            const data = {
                todos: this.todos,
                lists: this.lists,
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.showNotification('데이터가 성공적으로 내보내졌습니다!', 'success');
        } catch (error) {
            console.error('데이터 내보내기 오류:', error);
            this.showNotification('데이터 내보내기에 실패했습니다.', 'error');
        }
    }
    
    // 데이터 가져오기
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('현재 데이터를 모두 삭제하고 가져온 데이터로 교체하시겠습니까?')) {
                    if (data.todos) this.todos = data.todos;
                    if (data.lists) this.lists = data.lists;
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                        this.applySettings();
                    }
                    
                    this.saveTodos();
                    this.saveLists();
                    this.saveSettings();
                    
                    this.renderLists();
                    this.render();
                    this.updateSidebarCounts();
                    
                    this.showNotification('데이터가 성공적으로 가져와졌습니다!', 'success');
                    this.settingsModal.classList.remove('show');
                }
            } catch (error) {
                console.error('데이터 가져오기 오류:', error);
                this.showNotification('잘못된 파일 형식입니다.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // 파일 입력 초기화
    }
    
    // 모든 데이터 초기화
    resetAllData() {
        if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            if (confirm('마지막 확인: 할 일, 목록, 설정이 모두 삭제됩니다. 계속하시겠습니까?')) {
                localStorage.removeItem('todos');
                localStorage.removeItem('lists');
                localStorage.removeItem('settings');
                
                this.showNotification('모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.', 'success');
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
    }
    
    // 알림 표시 (설정 반영)
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
            'info': this.settings.accentColor || '#667eea'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);
        
        // 효과음 재생
        if (this.settings.enableSounds) {
            this.playNotificationSound(type);
        }
        
        // 브라우저 알림
        if (this.settings.enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('할일목록', {
                body: message,
                icon: '/favicon.ico'
            });
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    // 알림 효과음 재생
    playNotificationSound(type) {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            // 타입별 다른 주파수
            const frequencies = {
                'success': [523, 659, 784], // C, E, G
                'error': [400, 300, 200],   // 하향 음
                'info': [440, 554, 659]     // A, C#, E
            };
            
            const freqs = frequencies[type] || frequencies.info;
            
            freqs.forEach((freq, index) => {
                setTimeout(() => {
                    oscillator.frequency.setValueAtTime(freq, context.currentTime);
                    gainNode.gain.setValueAtTime(0.1, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
                }, index * 100);
            });
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.3);
        } catch (error) {
            // 효과음 재생 실패는 무시
        }
    }
    
    // 목록 옵션 채우기
    populateListOptions() {
        // Clear existing options safely
        while (this.sideList.firstChild) {
            this.sideList.removeChild(this.sideList.firstChild);
        }
        
        this.lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = `${list.icon} ${list.name}`;
            this.sideList.appendChild(option);
        });
    }
    
    // 목록 이벤트 바인딩
    bindListEvents() {
        // 새 목록 버튼
        if (this.addListBtn) {
            this.addListBtn.addEventListener('click', () => {
                this.showListModal();
            });
        }
        
        // 목록 컨텍스트 메뉴 이벤트 - 각 메뉴 아이템에 직접 바인딩
        if (this.listContextMenu) {
            const menuItems = this.listContextMenu.querySelectorAll('.context-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    console.log('List context menu item clicked:', e.target);
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const action = item.dataset.action;
                    console.log('Context menu action:', action);
                    this.handleListContextMenuAction(action);
                    this.hideListContextMenu();
                });
            });
            
            // 전역 클릭 이벤트 (목록 컨텍스트 메뉴 닫기)
            document.addEventListener('click', (e) => {
                // 컨텍스트 메뉴나 목록 링크가 아닌 곳 클릭시 메뉴 숨기기
                if (!this.listContextMenu.contains(e.target) && 
                    !e.target.closest('.list-link')) {
                    setTimeout(() => {
                        this.hideListContextMenu();
                    }, 10); // 약간의 지연을 두어 클릭 이벤트가 제대로 처리되도록 함
                }
            });
        }
    }
    
    // 목록 컨텍스트 메뉴 표시
    showListContextMenu(x, y, listId) {
        console.log('showListContextMenu called with:', x, y, listId);
        if (!this.listContextMenu) {
            console.error('listContextMenu element not found');
            return;
        }
        
        this.currentContextMenuListId = listId;
        
        // 다른 컨텍스트 메뉴들 숨기기
        this.hideContextMenu();
        
        // 메뉴 위치 설정
        this.listContextMenu.style.left = x + 'px';
        this.listContextMenu.style.top = y + 'px';
        this.listContextMenu.classList.add('show');
        
        console.log('List context menu should now be visible');
        
        // 화면 밖으로 나가지 않도록 조정
        const rect = this.listContextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.listContextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.listContextMenu.style.top = (y - rect.height) + 'px';
        }
        
        // 기본 목록인 경우 삭제 메뉴 비활성화
        const deleteItem = this.listContextMenu.querySelector('[data-action="deleteList"]');
        if (deleteItem) {
            if (listId === 1) {
                deleteItem.style.opacity = '0.5';
                deleteItem.style.pointerEvents = 'none';
                deleteItem.title = '기본 목록은 삭제할 수 없습니다';
            } else {
                deleteItem.style.opacity = '1';
                deleteItem.style.pointerEvents = 'auto';
                deleteItem.title = '';
            }
        }
    }
    
    // 목록 컨텍스트 메뉴 숨기기
    hideListContextMenu() {
        if (this.listContextMenu) {
            this.listContextMenu.classList.remove('show');
        }
        this.currentContextMenuListId = null;
    }
    
    // 목록 컨텍스트 메뉴 액션 처리
    handleListContextMenuAction(action) {
        if (!this.currentContextMenuListId) return;
        
        const listId = this.currentContextMenuListId;
        
        switch (action) {
            case 'editList':
                this.editList(listId);
                break;
            case 'duplicateList':
                this.duplicateList(listId);
                break;
            case 'deleteList':
                if (listId !== 1) {
                    this.deleteList(listId);
                }
                break;
        }
    }
    
    // 목록 복제
    duplicateList(listId) {
        const originalList = this.lists.find(l => l.id === listId);
        if (!originalList) return;
        
        const newList = {
            id: this.nextListId++,
            name: `${originalList.name} 사본`,
            icon: originalList.icon,
            color: originalList.color,
            createdAt: new Date().toISOString()
        };
        
        this.lists.push(newList);
        this.saveLists();
        this.showNotification('목록이 복제되었습니다!', 'success');
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
    
    // 기본 목록 선택
    if (todoManager.lists.length > 0 && !todoManager.currentList) {
        todoManager.selectList(todoManager.lists[0].id);
    }
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