async function ensureSupabaseReady() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve();
    document.addEventListener('supabase-ready', () => resolve());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureSupabaseReady();

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
 
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
 
    document.getElementById('clearBtn').addEventListener('click', () => {
      document.getElementById('employeeForm').reset();
      photoPreview.innerHTML = '<i class="fas fa-user"></i>';
      photoUrl = '';
      document.getElementById('employeeId').value = '';
     });

    document.getElementById('employeeForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('employeeId').value;
      const name = document.getElementById('name').value.trim();
      const role = document.getElementById('role').value.trim();
      const team = document.getElementById('team').value.trim();
      const vacations = JSON.parse(document.getElementById('vacations').value || '[]');

      if (!name || !role || !team) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }

      try {
        let employee;
        if (id) {
          const { data, error } = await supabase
            .from('employees')
            .update({ name, role, team, photo: photoUrl })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          employee = data;

          await supabase.from('vacation_periods').delete().eq('employee_id', id);
        } else {
          const { data, error } = await supabase
            .from('employees')
            .insert([{ name, role, team, photo: photoUrl }])
            .select()
            .single();

          if (error) throw error;
          employee = data;
        }

        if (vacations.length > 0) {
          const vacationData = vacations.map(p => ({
            employee_id: employee.id,
            start: p.start,
            end: p.end
          }));

          console.log('Dados sendo enviados para vacation_periods:', vacationData);

          const { error: vacationError } = await supabase
            .from('vacation_periods')
            .insert(vacationData);

          if (vacationError) {
            console.error('Erro detalhado ao inserir períodos:', vacationError);
            throw vacationError;
          }
         }

        await Swal.fire({
          title: 'Sucesso!',
          text: 'Funcionário salvo com sucesso!',
          icon: 'success'
        });

        document.getElementById('employeeForm').reset();
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
        photoUrl = '';
        document.getElementById('employeeId').value = '';

      await loadEmployees();

      } catch (error) {
        console.error('Erro detalhado ao salvar funcionário:', error);
        await Swal.fire({
          title: 'Erro!',
          html: `Não foi possível salvar o funcionário.<br><br><small>${error.message}</small>`,
          icon: 'error'
        });
      }
    });

     document.getElementById('newUserBtn').addEventListener('click', () => {
      document.getElementById('employeeForm').reset();
      photoPreview.innerHTML = '<i class="fas fa-user"></i>';
      photoUrl = '';
      document.getElementById('employeeId').value = '';
      document.getElementById('saveButton').innerHTML = '<i class="fas fa-save"></i> Salvar Funcionário';
      document.getElementById('newUserBtn').style.display = 'none';
    });

     await loadEmployees();

  } catch (error) {
    console.error('Erro na inicialização:', error);
    window.location.href = 'login.html';
  }
});

