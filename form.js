async function ensureSupabaseReady() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve();
    document.addEventListener('supabase-ready', () => resolve());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureSupabaseReady();
    
    // Verifica autenticação
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    // Configurações do upload de foto
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    let photoUrl = '';

    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('uploadBtn').addEventListener('click', () => {
      photoInput.click();
    });

    // Botão de limpar
    document.getElementById('clearBtn').addEventListener('click', () => {
      document.getElementById('employeeForm').reset();
      photoPreview.innerHTML = '<i class="fas fa-user"></i>';
      photoUrl = '';
    });

    // Botão de salvar
    document.getElementById('saveButton').addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        // Coleta dos dados
        const name = document.getElementById('name').value.trim();
        const matricula = document.getElementById('matricula').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const hireDate = document.getElementById('hireDate').value;
        const status = document.getElementById('status').value;
        const team = document.getElementById('team').value;
        const lastVacation = document.getElementById('lastVacation').value || null;

        // Validação
        if (!name || !matricula || !hireDate || !status || !team) {
          await Swal.fire('Atenção!', 'Preencha todos os campos obrigatórios.', 'warning');
          return;
        }

        // Dados do funcionário
        const employeeData = {
          name,
          matricula,
          phone,
          hire_date: hireDate,
          status,
          team,
          last_vacation: lastVacation,
          on_vacation: false,
          photo: photoUrl,
        };

        // Chamada ao Supabase com headers de autenticação
        const { data, error } = await supabase
          .from('employees')
          .insert([employeeData])
          .select();

        if (error) throw error;

        // Limpeza do formulário
        document.getElementById('employeeForm').reset();
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
        photoUrl = '';

        // Mensagem de sucesso
        await Swal.fire({
          title: 'Sucesso!',
          text: 'Funcionário cadastrado com sucesso.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Atualiza a lista
        await loadEmployees();

      } catch (error) {
        console.error('Erro ao salvar funcionário:', error);
        await Swal.fire({
          title: 'Erro!',
          text: error.message.includes('row-level security') ? 
            'Permissão negada. Verifique as configurações de segurança no Supabase.' : 
            'Não foi possível cadastrar o funcionário. ' + error.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });

    // Carrega a lista de funcionários
    async function loadEmployees() {
      try {
        const { data: employees, error } = await supabase
          .from('employees')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        const tbody = document.getElementById('employeesList');
        tbody.innerHTML = '';

        employees.forEach(emp => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.matricula}</td>
            <td>${window.utils?.formatStatus(emp.status) || emp.status}</td>
            <td>${emp.team}</td>
            <td>${emp.last_vacation ? window.utils?.formatDate(emp.last_vacation) || emp.last_vacation : 'Nunca'}</td>
            <td>
              <a href="profile.html?id=${emp.id}" class="btn-view"><i class="fas fa-eye"></i></a>
              <a href="cadastro.html?id=${emp.id}" class="btn-edit"><i class="fas fa-edit"></i></a>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
      }
    }

    // Inicialização
    await loadEmployees();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    window.location.href = 'login.html';
  }
 });