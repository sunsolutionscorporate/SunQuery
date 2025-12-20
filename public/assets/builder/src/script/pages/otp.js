app.view({
   otp: function () {
      function content_otp_form(email) {
         return `
         <p>Enter the OTP sent to your email ${email}. Keep this code private and never share it with anyone, even if they claim to be from us.</p>
         <div class="form-otp">
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         </div>

         <div class="login-action">
         <button class="btn btn-primary">Verify</button>
         <span>Code not received? <a class="btn-resend">Request again</a></span>
      `;
      };
      function content_otp_resend(email) {
         return `
         <p>The OTP code you entered has expired.  Please request a new code by pressing the 'Resend' button.  The new OTP will be sent to your email '${email}'.</p>

         <div class="login-action">
         <button type="button" class="btn btn-primary btn-resend">Resend</button>
      `;
      };
      xx = `
            <div class="login frm-otp" id="wasu">
               <section>
                  <div class="head">
                     <h1>OTP Verify</h1>
                  </div>
                  <div class="body">
                     <form action="" class="otp">

                     </form>
                  </div>
               </section>
            </div>
            `;
      return View.dispatch(xx, {
         mount(response) {
            let otp = response.data?.otp;
            let token = otp?.token;
            let payload = otp?.data;

            if (otp) {
               n.storage.save('otp', {
                  token: otp.token,
                  expires: otp.expires,
                  data: otp.data
               });
            } else {
               otp = n.storage.load('otp');
               token = otp?.token;
               payload = otp?.data;
            };
            function reloadForm(selector) {
               const form = d.querySelector(selector);
               form.innerHTML = content_otp_form(payload?.email || '');

               const inputs = form.querySelectorAll(".form-otp input");
               inputs.forEach((input, index) => {
                  input.addEventListener("input", () => {
                     if (input.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                     }
                  });
                  input.addEventListener("keydown", (e) => {
                     if (e.key === "Backspace" && input.value === "" && index > 0) {
                        inputs[index - 1].focus();
                     }
                  });
               });
               return inputs;
            };
            let inputs = reloadForm('.login form');
            // 
            const otp_submit = function () {
               // Gabungkan semua nilai input jadi satu string
               const code = Array.from(inputs).map((input) => input.value).join("");
               if (code.length < 6) {
                  alert("Lengkapi semua digit OTP!");
                  return;
               };
               n.loader({ target: d.body, logo: buildURL('assets/images/logo.png') });
               n.ajax({
                  url: buildURL('api/verify'),
                  data: {
                     token: token,
                     code: code
                  },
                  method: 'POST',
                  success: (res) => {
                     // log('SUCCESS', res)
                     n.storage.remove('otp');
                     n.storage.save('auth_session', res.data.token);
                     location.hash = "";
                  },
                  error: (err) => {
                     if (err.message === 'Expired verification code') {
                        const data = err.data;
                        // hapus semua token yg disimpan
                        n.storage.remove('otp');
                        n.storage.remove('auth_session');
                        this.innerHTML = content_otp_resend(payload?.email || '');
                        return;
                     }
                     log('ERROR', err)
                  },
                  always: () => n(d.body).stopLoader(),
               });
            };

            const otp_resend = function () {
               n.loader({ target: d.body, logo: buildURL('assets/images/logo.png') });
               n.ajax({
                  url: buildURL('api/resend-otp'),
                  data: payload,
                  method: 'POST',
                  success: (res) => {
                     otp = res.data;
                     token = otp?.token;
                     payload = otp?.data;

                     n.storage.save('otp', {
                        token: otp.token,
                        expires: otp.expires,
                        data: otp.data
                     });
                     inputs = reloadForm('.login form');
                  },
                  error: (err) => {
                     log('ERROR RESEND OTP', err)
                  },
                  always: () => n(d.body).stopLoader(),
               })
            }
            // 

            n('.login form.otp').on('submit', function (ev) {
               ev.preventDefault();
               log('SUBMIT');
               otp_submit.call(this);
            });

            n(".login form.otp").on('click', function (ev) {
               if (!ev.target.closest('.btn-resend')) return
               ev.preventDefault();
               otp_resend.call(this);
            });

         }
      });
   },
});