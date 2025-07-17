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
          photoUrl = e.target.result;
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
      document.getElementById('employeeId').value = '';
      document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> Salvar Funcionário';
      document.getElementById('newUserBtn').style.display = 'none';
    });

    // Verifica se há ID para edição
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');

    if (employeeId) {
      await loadEmployeeForEdit(employeeId);
    }

    // Botão de salvar - CORREÇÃO PRINCIPAL
    document.getElementById('saveButton').addEventListener('click', async (e) => {
      e.preventDefault();
      
      const saveButton = e.currentTarget;
      const originalText = saveButton.innerHTML;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
      saveButton.disabled = true;

      try {
        const id = document.getElementById('employeeId').value;
        const employeeData = {
          name: document.getElementById('name').value.trim(),
          matricula: document.getElementById('matricula').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          hire_date: document.getElementById('hireDate').value,
          status: document.getElementById('status').value,
          team: document.getElementById('team').value,
          last_vacation: document.getElementById('lastVacation').value || null,
          photo: photoUrl || null,
          updated_at: new Date().toISOString()
        };

        // Validação
        if (!employeeData.name || !employeeData.matricula || !employeeData.hire_date || 
            !employeeData.status || !employeeData.team) {
          await Swal.fire('Atenção', 'Preencha todos os campos obrigatórios', 'warning');
          return;
        }

        let result;
        if (id) {
          // Atualização
          result = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', id);
        } else {
          // Cadastro novo
          employeeData.on_vacation = false;
          employeeData.created_at = new Date().toISOString();
          result = await supabase
            .from('employees')
            .insert([employeeData]);
        }

        if (result.error) throw result.error;

        // Feedback visual
        await Swal.fire({
          title: id ? 'Atualizado!' : 'Cadastrado!',
          text: `Funcionário ${employeeData.name} salvo com sucesso`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Limpa se for novo cadastro
        if (!id) {
          document.getElementById('employeeForm').reset();
          photoPreview.innerHTML = '<i class="fas fa-user"></i>';
          photoUrl = '';
        }

        // Atualiza lista
        await loadEmployees();

      } catch (error) {
        console.error('Erro ao salvar:', error);
        await Swal.fire({
          title: 'Erro',
          text: 'Não foi possível salvar. Verifique o console para detalhes.',
          icon: 'error'
        });
      } finally {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      }
    });

    // Carrega funcionário para edição
    async function loadEmployeeForEdit(id) {
      try {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

      if (error) throw error;
      
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('name').value = employee.name || '';
        document.getElementById('matricula').value = employee.matricula || '';
        document.getElementById('phone').value = employee.phone || '';
        document.getElementById('hireDate').value = employee.hire_date || '';
        document.getElementById('status').value = employee.status || '';
        document.getElementById('team').value = employee.team || '';
        document.getElementById('lastVacation').value = employee.last_vacation || '';

        if (employee.photo) {
          photoPreview.innerHTML = `<img src="${employee.photo}" alt="Preview">`;
          photoUrl = employee.photo;
        }

        document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> Atualizar Funcionário';
        document.getElementById('newUserBtn').style.display = 'block';

      } catch (error) {
        console.error('Erro ao carregar:', error);
        await Swal.fire('Erro', 'Não foi possível carregar os dados', 'error');
      }
    }

    // Carrega lista de funcionários
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
            <td>${emp.last_vacation ? window.utils?.formatDate(emp.last_vacation) : 'Nunca'}</td>
            <td>
              <a href="profile.html?id=${emp.id}" class="btn-view"><i class="fas fa-eye"></i></a>
              <a href="cadastro.html?id=${emp.id}" class="btn-edit"><i class="fas fa-edit"></i></a>
              <button class="btn-delete" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });

        // Eventos de delete
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const { isConfirmed } = await Swal.fire({
              title: 'Confirmar exclusão',
              text: 'Tem certeza que deseja excluir este funcionário?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sim, excluir',
              cancelButtonText: 'Cancelar'
            });

            if (isConfirmed) {
              const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

              if (error) throw error;

              await Swal.fire('Excluído!', 'Funcionário removido com sucesso', 'success');
              await loadEmployees();
            }
          });
        });

      } catch (error) {
        console.error('Erro ao carregar:', error);
        const tbody = document.getElementById('employeesList');
        tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar lista</td></tr>';
      }
    }
 
    // Inicialização
    await loadEmployees();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    window.location.href = 'login.html';
  }
});