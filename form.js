document.addEventListener('DOMContentLoaded', function () {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  const inputs = ['vacationDay1', 'vacationDay2', 'vacationDay3'];
  inputs.forEach(id => document.getElementById(id).addEventListener('input', updateTotalDays));
  document.getElementById('hireDate').addEventListener('change', updateVacationCounter);
  document.getElementById('lastVacation').addEventListener('change', updateVacationCounter);
  document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('photoInput').click());
  document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
  document.getElementById('saveButton').addEventListener('click', saveEmployee);
  document.getElementById('clearBtn').addEventListener('click', clearForm);
  document.getElementById('searchInput').addEventListener('input', loadEmployees);

  loadEmployees();

  const storedId = localStorage.getItem('editEmployeeId');
  if (storedId) {
    const check = setInterval(() => {
      const employees = JSON.parse(localStorage.getItem('employees')) || [];
      if (employees.find(e => e.id === storedId)) {
        editEmployee(storedId);
        localStorage.removeItem('editEmployeeId');
        clearInterval(check);
      }
    }, 100);
  }

  // Código do admin movido para depois das verificações
  if (currentUser?.isAdmin) {
    document.getElementById('newUserBtn').style.display = 'inline-block';

    // Modal para novo usuário
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

    document.getElementById('userForm').addEventListener('submit', function(e) {
      e.preventDefault();
     
      const username = document.getElementById('newUsername').value;
      const password = document.getElementById('newPassword').value;
      const isAdmin = document.getElementById('userType').value === 'admin';
     
      const users = JSON.parse(localStorage.getItem('users')) || [];
     
      if (users.some(u => u.username === username)) {
        alert('Já existe um usuário com esse nome!');
        return;
      }
     
      users.push({
        username,
        password,
        isAdmin
      });
     
      localStorage.setItem('users', JSON.stringify(users));
      alert('Usuário cadastrado com sucesso!');
      modal.style.display = 'none';
      this.reset();
    });
  }
});
