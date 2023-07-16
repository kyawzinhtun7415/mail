document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email(email) {
  // Show compose view and hide other views
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  // Pre-fill the form if an email is provided
  if (email && email.sender) {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = 
      email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = 
    `\n\n-----\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#emails-view").style.display = "block";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Fetch emails from the mailbox
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Iterate over each email
      emails.forEach((email) => {
        // Create a new email div
        const emailDiv = document.createElement("div");
        emailDiv.className = "email";

        // If the email has been read, set a gray background
        if (email.read) {
          emailDiv.style.backgroundColor = "lightgray";
        }

        // Add email's sender, subject, and timestamp to the div
        emailDiv.innerHTML = `
        <b>${email.sender}</b>
        <b>${email.subject}</b>
        <b>${email.timestamp}</b>
      `;

        // Add an event listener to the email div
        emailDiv.addEventListener("click", () => load_email(email.id));

        // Append the new email div to the emails view
        document.querySelector("#emails-view").appendChild(emailDiv);
      });
    });
}

function send_email(event) {
  event.preventDefault();

  // Get email data from the form
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // Send a POST request to the server with the email data
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // If the email was sent successfully, load the sent mailbox
      if (result.message === "Email sent successfully") {
        load_mailbox("sent");
      } else {
        // Show error message
        const errorMessage = document.querySelector("#error-message");
        errorMessage.innerHTML = result.error;
        errorMessage.style.display = "block";
      }
    });
}

// Get a single email
function load_email(id) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      console.log(email);

      // Hide other views and show the email view
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      const emailView = document.querySelector("#email-view");
      emailView.style.display = "block";

      // Add the email details
      emailView.innerHTML = `
      <b>From:</b>${email.sender}</br>
      <b>To:</b>${email.recipients.join(", ")}<br>
      <b>Subject:</b>${email.subject}<br>
      <b>Timestamp:</b>${email.timestamp}<br>
      <hr>
      ${email.body}
    `;

      // Add the Reply button
      const replyButton = document.createElement("button");
      replyButton.textContent = "Reply";
      replyButton.addEventListener("click", () => compose_email(email));
      document.querySelector('#email-view').append(replyButton);

      // Add the Archive/Unarchive button
      const archiveButton = document.createElement("button");
      archiveButton.textContent = email.archived ? "Unarchive" : "Archive";
      archiveButton.addEventListener("click", () =>
        toggle_archive(id, email.archived)
      );
      document.querySelector("#email-view").append(archiveButton);

      // Mark the email as read
      fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true,
        }),
      });
    });
}

// Toggles the Archive/Unarhive button
function toggle_archive(id, archived) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !archived,
    }),
  }).then(() => load_mailbox("inbox"));
}
