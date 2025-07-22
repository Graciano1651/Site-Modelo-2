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

    // Função para salvar funcionário - VERSÃO DEFINITIVA
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

          // Deletar períodos antigos
          const { error: deleteError } = await supabase
            .from('vacation_periods')
            .delete()
            .eq('employee_id', id);

          if (deleteError) console.error('Erro ao deletar períodos antigos:', deleteError);

          // Inserir novos períodos
          if (vacationPeriods.length > 0) {
             const { error: insertError } = await supabase
              .from('vacation_periods')
              .insert(vacationPeriods.map(period => ({
                ...period,
                employee_id: id,
                created_at: new Date().toISOString()
              })));

            if (insertError) throw insertError;
          }
        } else {
          // Inserção de novo funcionário
          employeeData.created_at = new Date().toISOString();
          employeeData.on_vacation = false;
          result = await supabase
            .from('employees')
            .insert([employeeData])
            .select();

          if (result.error) throw result.error;

          // Inserir períodos de férias para novo funcionário
          if (result.data?.length > 0 && vacationPeriods.length > 0) {
             const newEmployeeId = result.data[0].id;
            const { error: insertError } = await supabase
              .from('vacation_periods')
              .insert(vacationPeriods.map(period => ({
                ...period,
                employee_id: newEmployeeId,
                created_at: new Date().toISOString()
              })));

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
                  <p>${error.message}</p>
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

    // [Restante do código permanece exatamente igual...]
    
    // Inicialização
    await loadEmployees();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    window.location.href = 'login.html';
  }
});