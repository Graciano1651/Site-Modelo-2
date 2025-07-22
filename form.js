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

    // Função para salvar funcionário - VERSÃO CORRIGIDA
    async function saveEmployee() {
      const saveButton = document.getElementById('saveButton');
      const originalText = saveButton.innerHTML;
      
       try {
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        saveButton.disabled = true;

        const id = document.getElementById('employeeId').value;
        const name = document.getElementById('name').value.trim();
        const matricula = document.getElementById('matricula').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const hireDate = document.getElementById('hireDate').value;
        const status = document.getElementById('status').value;
        const team = document.getElementById('team').value;
        const lastVacation = document.getElementById('lastVacation').value || null;

        // Validação reforçada
        if (!name) throw new Error('Nome é obrigatório');
        if (!matricula) throw new Error('Matrícula é obrigatória');
        if (!hireDate) throw new Error('Data de contratação é obrigatória');
        if (!status) throw new Error('Status é obrigatório');
        if (!team) throw new Error('Frente de trabalho é obrigatória');

        // Coletar períodos de férias
        const vacationPeriods = [];
        for (let i = 1; i <= 3; i++) {
          const days = document.getElementById(`vacationDay${i}`).value;
          const date = document.getElementById(`vacationDate${i}`).value;
          if (days && date) {
            vacationPeriods.push({
              days: parseInt(days),
              start_date: date
            });
          }
        }

        const employeeData = {
          name,
          matricula,
          phone: phone || null,
          hire_date: hireDate,
          status,
          team,
          last_vacation: lastVacation,
          photo: photoUrl || null,
        };

        let result;
        if (id) {
          // Atualização
          result = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', id)
            .select();

          if (result.error) throw result.error;

          // Deletar períodos antigos e adicionar novos
          const { error: deleteError } = await supabase
            .from('vacation_periods')
            .delete()
            .eq('employee_id', id);

          if (deleteError) console.error('Erro ao deletar períodos antigos:', deleteError);

          if (vacationPeriods.length > 0) {
            const periodsToInsert = vacationPeriods.map(period => ({
              ...period,
              employee_id: id
            }));

            const { error: insertError } = await supabase
              .from('vacation_periods')
              .insert(periodsToInsert);

            if (insertError) throw insertError;
          }
        } else {
          // Inserção
          employeeData.created_at = new Date().toISOString();
          employeeData.on_vacation = false;
          result = await supabase
            .from('employees')
            .insert([employeeData])
            .select();

          if (result.error) throw result.error;

          // Adicionar períodos de férias para novo funcionário
          if (result.data && result.data.length > 0 && vacationPeriods.length > 0) {
            const newEmployeeId = result.data[0].id;
            const periodsToInsert = vacationPeriods.map(period => ({
              ...period,
              employee_id: newEmployeeId
            }));

            const { error: insertError } = await supabase
              .from('vacation_periods')
              .insert(periodsToInsert);

            if (insertError) throw insertError;
          }
        }

        await Swal.fire({
          title: 'Sucesso!',
          text: id ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!',
          icon: 'success'
        });

        // Limpar formulário se for novo cadastro
        if (!id) {
          document.getElementById('employeeForm').reset();
          document.getElementById('photoPreview').innerHTML = '<i class="fas fa-user"></i>';
          photoUrl = '';
        }

        // Atualizar lista
        await loadEmployees();

      } catch (error) {
        console.error('Erro ao salvar funcionário:', error);
        await Swal.fire({
          title: 'Erro!',
          html: `<div style="text-align:left">
                  <p><strong>Não foi possível salvar o funcionário</strong></p>
                  <p>Erro: ${error.message}</p>
                </div>`,
          icon: 'error'
        });
      } finally {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      }
    }

    // Configurar evento de clique no botão salvar
    document.getElementById('saveButton').addEventListener('click', saveEmployee);

    // Carrega funcionário para edição
    async function loadEmployeeForEdit(id) {
      try {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!employee) return;

        // Preenche o formulário
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

        // Carrega períodos de férias
        const { data: vacationPeriods, error: periodsError } = await supabase
          .from('vacation_periods')
          .select('*')
          .eq('employee_id', id)
          .order('start_date', { ascending: true });

        if (!periodsError && vacationPeriods) {
          // Limpa campos de férias primeiro
          for (let i = 1; i <= 3; i++) {
            document.getElementById(`vacationDay${i}`).value = '';
            document.getElementById(`vacationDate${i}`).value = '';
          }
          
          // Preenche com os dados existentes
          for (let i = 0; i < Math.min(3, vacationPeriods.length); i++) {
            document.getElementById(`vacationDay${i+1}`).value = vacationPeriods[i].days;
            document.getElementById(`vacationDate${i+1}`).value = vacationPeriods[i].start_date.split('T')[0]; // Remove hora se existir
          }
        }

        document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> Atualizar Funcionário';
        document.getElementById('newUserBtn').style.display = 'block';

      } catch (error) {
        console.error('Erro ao carregar funcionário para edição:', error);
        await Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível carregar os dados do funcionário.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
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
            <td>${emp.last_vacation ? window.utils?.formatDate(emp.last_vacation) || emp.last_vacation : 'Nunca'}</td>
            <td>
              <a href="profile.html?id=${emp.id}" class="btn-view"><i class="fas fa-eye"></i></a>
              <a href="cadastro.html?id=${emp.id}" class="btn-edit"><i class="fas fa-edit"></i></a>
              <button class="btn-delete" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });

        // Adiciona eventos de delete
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
              await deleteEmployee(id);
            }
          });
        });

      } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        const tbody = document.getElementById('employeesList');
        tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar lista de funcionários</td></tr>';
      }
    }

    // Deleta funcionário
    async function deleteEmployee(id) {
      try {
        // Primeiro verifica se o funcionário existe
        const { data: employee, error: fetchError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !employee) {
          throw new Error('Funcionário não encontrado');
        }

        // Confirmação adicional
        const { isConfirmed } = await Swal.fire({
          title: `Excluir ${employee.name}?`,
          text: `Matrícula: ${employee.matricula}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sim, excluir permanentemente',
          cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        // Primeiro deleta os períodos de férias
        await supabase
          .from('vacation_periods')
          .delete()
          .eq('employee_id', id);

        // Depois deleta o funcionário
        const { error: deleteError } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        // Feedback visual
        const toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });

        await toast.fire({
          icon: 'success',
          title: `${employee.name} excluído com sucesso`
        });

        // Atualiza a lista e limpa o formulário se estiver editando o funcionário deletado
        const currentId = document.getElementById('employeeId').value;
        if (currentId === id) {
          document.getElementById('employeeForm').reset();
          document.getElementById('photoPreview').innerHTML = '<i class="fas fa-user"></i>';
          photoUrl = '';
          document.getElementById('employeeId').value = '';
          document.getElementById('deleteBtn').style.display = 'none';
        }
        
        await loadEmployees();

      } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        await Swal.fire({
          title: 'Erro!',
          html: `Não foi possível excluir o funcionário.<br><br>
                <small>${error.message}</small>`,
          icon: 'error'
        });
      }
    }

    // Botão Novo Usuário
    document.getElementById('newUserBtn').addEventListener('click', () => {
      document.getElementById('employeeForm').reset();
      photoPreview.innerHTML = '<i class="fas fa-user"></i>';
      photoUrl = '';
      document.getElementById('employeeId').value = '';
      document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> Salvar Funcionário';
      document.getElementById('newUserBtn').style.display = 'none';
    });

    // Inicialização
    await loadEmployees();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    window.location.href = 'login.html';
  }
});