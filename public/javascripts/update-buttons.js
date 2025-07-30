 const editBtnEdu = document.getElementById('edit-education-btn');
    const saveBtnEdu = document.getElementById('save-education-btn');
    const cancelBtnEdu = document.getElementById('cancel-edit-btn');
    const formEdu = document.getElementById('edit-education-form');
    const educationText = document.getElementById('education-text');
    const educationInput = document.getElementById('education-input');

    editBtnEdu.addEventListener('click', () => {
        educationText.style.display = 'none';
        formEdu.style.display = 'block';
        educationInput.value = educationText.innerText;
    });

 cancelBtnEdu.addEventListener('click', () => {
        formEdu.style.display = 'none';
        educationText.style.display = 'block';
    });

 saveBtnEdu.addEventListener('click', async () => {
        const newText = educationInput.value;

        const response = await fetch('/korisnik/update-education', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ education: newText })
        });

        if (response.ok) {
            educationText.innerText = newText;
            formEdu.style.display = 'none';
            educationText.style.display = 'block';
        } else {
            alert('RESPONSE NIJE OKEJ ');
        }
    });

 /*Biografija*/

 const editBtnBio = document.getElementById('edit-bio-btn');
 const saveBtnBio = document.getElementById('save-bio-btn');
 const cancelBtnBio = document.getElementById('cancel-bio-btn');
 const formBio = document.getElementById('edit-bio-form');
 const bioText = document.getElementById('bio-text');
 const bioInput = document.getElementById('bio-input');

 editBtnBio.addEventListener('click', () => {
     bioText.style.display = 'none';
     formBio.style.display = 'block';
     bioInput.value = bioText.innerText;
 });

 cancelBtnBio.addEventListener('click', () => {
     formBio.style.display = 'none';
     bioText.style.display = 'block';
 });

 saveBtnBio.addEventListener('click', async () => {
     const newText = bioInput.value;

     const response = await fetch('/korisnik/update-bio', {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json',
         },
         body: JSON.stringify({ biografija: newText })
     });

     if (response.ok) {
         bioText.innerText = newText;
         formBio.style.display = 'none';
         bioText.style.display = 'block';
     } else {
         alert('RESPONSE NIJE OKEJ ');
     }
 });


 /*Radno iskustvo*/

 const editBtnRi = document.getElementById('edit-ri-btn');
 const saveBtnRi = document.getElementById('save-ri-btn');
 const cancelBtnRi = document.getElementById('cancel-ri-btn');
 const formRi = document.getElementById('edit-ri-form');
 const RiText = document.getElementById('ri-text');
 const RiInput = document.getElementById('ri-input');

 editBtnRi.addEventListener('click', () => {
     RiText.style.display = 'none';
     formRi.style.display = 'block';
     RiInput.value = RiText.innerText;
 });

 cancelBtnRi.addEventListener('click', () => {
     formRi.style.display = 'none';
     RiText.style.display = 'block';
 });

 saveBtnRi.addEventListener('click', async () => {
     const newText = RiInput.value;

     const response = await fetch('/korisnik/update-radno-iskustvo', {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json',
         },
         body: JSON.stringify({ radno_iskustvo: newText })
     });

     if (response.ok) {
         RiText.innerText = newText;
         formRi.style.display = 'none';
         RiText.style.display = 'block';
     } else {
         alert('RESPONSE NIJE OKEJ ');
     }
 });


/*CV*/


 document.getElementById("edit-documents-btn").addEventListener("click", function () {
     document.getElementById("edit-documents-form").style.display = "block";
     this.style.display = "none";
 });

 document.getElementById("cancel-edit-btnCv").addEventListener("click", function () {
     document.getElementById("edit-documents-form").style.display = "none";
     document.getElementById("edit-documents-btn").style.display = "inline-block";
 });



 document.getElementById("edit-documents-form").addEventListener("submit", async function (event) {
     event.preventDefault();

     const form = event.target;
     const formData = new FormData(form);
     const title = document.getElementById("title-input").value;
     try {

         const response = await fetch("/korisnik/upload-cv", {
             method: "POST",
             body: formData,
         });

         if (response.ok) {
             const result = await response.json();
             alert(`Fajl uspješno spremljen! ID: ${result.fileId}`);
             form.reset();
             document.getElementById("file-display").style.display = "block";
             document.getElementById("file-name").textContent = title || "Nepoznato ime fajla";
             document.getElementById("download-link").href = `/korisnik/download-cv`;
             document.getElementById("edit-documents-form").style.display = "none";
         } else {
             const error = await response.json();
             alert(`Greška: ${error.error || "Nepoznata greška."}`);
         }
     } catch (err) {
         console.error("Greška prilikom slanja zahtjeva:", err);
         alert("Greška! Pokušajte ponovo!");
     }
 });

 document.getElementById("cancel-edit-btnCv").addEventListener("click", function () {
     const form = document.getElementById("edit-documents-form");
     form.style.display = "none"; //
     form.reset();
 });



