document.addEventListener('DOMContentLoaded', async function () {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Configurar eventos do formulário
  const inputs = ['vacationDay1', 'vacationDay2', 'vacationDay3'];
  inputs.forEach(id => document.getElementById(id).addEventListener('input', updateTotalDays));
  document.getElementById('hireDate').addEventListener('change', updateVacationCounter);
  document.getElementById('lastVacation').addEventListener('change', updateVacationCounter);
  document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('photoInput').click());
  document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
  document.getElementById('saveButton').addEventListener('click', saveEmployee);
  document.getElementById('clearBtn').addEventListener('click', clearForm);
  document.getElementById('searchInput').addEventListener('input', loadEmployees);

  await loadEmployees();

  // Verificar se há ID para edição
  const storedId = localStorage.getItem('editEmployeeId');
  if (storedId) {
    await editEmployee(storedId);
    localStorage.removeItem('editEmployeeId');
  }

  // Configurações de admin
  if (currentUser?.isAdmin) {
    document.getElementById('newUserBtn').style.display = 'inline-block';
    setupUserModal();
  }
});

async function loadEmployees() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  let query = supabase.from('employees').select('*');
  
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`);
  }

  const { data: employees, error } = await query;

  if (error) {
    console.error('Erro ao carregar funcionários:', error);
    return;
  }

  const tbody = document.getElementById('employeesList');
  tbody.innerHTML = '';

  employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.matricula}</td>
      <td>${formatStatus(emp.status)}</td>
      <td>${emp.team}</td>
      <td>${emp.on_vacation ? 'Em férias' : calcDisponibilidade(emp.hire_date, emp.last_vacation) ? 'Disponível' : 'Indisponível'}</td>
      <td>
        <button class="btn btn-primary btn-small" onclick="editEmployee('${emp.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-small" onclick="deleteEmployee('${emp.id}')"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveEmployee() {
  const id = document.getElementById('employeeId').value;
  const formData = {
    name: document.getElementById('name').value,
    matricula: document.getElementById('matricula').value,
    phone: document.getElementById('phone').value,
    hire_date: document.getElementById('hireDate').value,
    status: document.getElementById('status').value,
    team: document.getElementById('team').value,
    last_vacation: document.getElementById('lastVacation').value || null,
    photo: document.getElementById('photoPreview').querySelector('img')?.src || null,
    on_vacation: false, // Será atualizado abaixo
    vacation_start_date: null,
    total_vacation_days: 0
  };

  // Calcular dias de férias
  const vacationDays = calculateVacationDays();
  if (vacationDays.total > 0) {
    formData.on_vacation = true;
    formData.vacation_start_date = vacationDays.dates[0];
    formData.total_vacation_days = vacationDays.total;
  }

  try {
    if (id) {
      // Atualizar funcionário existente
      const { error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', id);
      
      if (error) throw error;
    } else {
      // Criar novo funcionário
      const { error } = await supabase
        .from('employees')
        .insert([formData]);
      
      if (error) throw error;
    }

    // Salvar períodos de férias
    await saveVacationPeriods(id || formData.id, vacationDays.datesWithDays);
    
    alert('Funcionário salvo com sucesso!');
    clearForm();
    await loadEmployees();
  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    alert('Erro ao salvar funcionário!');
  }
}

async function editEmployee(id) {
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao carregar funcionário:', error);
    return;
  }

  // Preencher formulário
  document.getElementById('employeeId').value = employee.id;
  document.getElementById('name').value = employee.name;
  document.getElementById('matricula').value = employee.matricula;
  document.getElementById('phone').value = employee.phone;
  document.getElementById('hireDate').value = employee.hire_date;
  document.getElementById('status').value = employee.status;
  document.getElementById('team').value = employee.team;
  document.getElementById('lastVacation').value = employee.last_vacation || '';
  
  if (employee.photo) {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${employee.photo}" alt="${employee.name}">`;
  }

  // Carregar períodos de férias
  const { data: periods, error: periodsError } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', id)
    .order('start_date', { ascending: true });

  if (!periodsError && periods.length > 0) {
    periods.forEach((period, i) => {
      if (i < 3) {
        document.getElementById(`vacationDay${i+1}`).value = period.days;
        document.getElementById(`vacationDate${i+1}`).value = period.start_date;
      }
    });
    updateTotalDays();
  }

  updateVacationCounter();
}

async function deleteEmployee(id) {
  if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir funcionário:', error);
    alert('Erro ao excluir funcionário!');
    return;
  }

  await loadEmployees();
}

async function saveVacationPeriods(employeeId, datesWithDays) {
  // Primeiro, remover períodos antigos
  await supabase
    .from('vacation_periods')
    .delete()
    .eq('employee_id', employeeId);

  // Inserir novos períodos
  const periods = datesWithDays.map(({ date, days }) => ({
    employee_id: employeeId,
    start_date: date,
    days: days
  }));

  if (periods.length > 0) {
    await supabase
      .from('vacation_periods')
      .insert(periods);
  }
}

function setupUserModal() {
  const modal = document.getElementById('userModal');
  const btn = document.getElementById('newUserBtn');
  const span = document.getElementsByClassName('close')[0];

  btn.onclick = function() {
    modal.style.display = 'block';
  }

  span.onclick = function() {
    modal.style.display = 'none';
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }

  document.getElementById('saveUserBtn').addEventListener('click', async function() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const isAdmin = document.getElementById('userType').value === 'admin';

    if (!username || !password) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    try {
      // Verificar se usuário já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (existingUser && !checkError) {
        alert('Já existe um usuário com esse nome!');
        return;
      }

      // Criar novo usuário
      const { error } = await supabase
        .from('users')
        .insert([{
          username,
          password, // Na prática, usaríamos hash
          is_admin: isAdmin
        }]);

      if (error) throw error;

      alert('Usuário cadastrado com sucesso!');
      modal.style.display = 'none';
      document.getElementById('userForm').reset();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário!');
    }
  });
}

// Funções auxiliares do formulário permanecem iguais
function updateTotalDays() {
  // Implementação existente
}

function updateVacationCounter() {
  // Implementação existente
}

function handlePhotoUpload(e) {
  // Implementação existente
}

function clearForm() {
  // Implementação existente
}

function calculateVacationDays() {
  // Implementação existente
}