app.view({
   login: function () {
      xx = `
            <div class="login frm-sign" id="wasu">
               <section>
                  <div class="head">
                     <h1>Sign in</h1>
                  </div>
                  <div class="body">
                     <form action="">
                        <div class="form-group">
                           <label for="email">Email</label>
                           <div class="input-group">
                              <input type="text" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-group">
                           <label for="password">Password</label>
                           <div class="input-group">
                              <input type="password" name="password" id="password" />
                           </div>
                        </div>

                        <div class="login-action">
                           <a href="#">Forgot Password?</a>
                           <button type="submit" class="btn btn-primary">Sign In</button>
                           <span class="sparator">or</span>


                           <button type="button" class="btn btn-google" id="googleLogin">
                              <img src="http://localhost/assets/images/google.svg" alt="Google">
                              <span>Continue with Google</span>
                           </button>

                     </form>
                  </div>
               </section>
               <span>New to CBNLink? <a href="#">Join now</a></span>
            </div>
            `;
      return View.dispatch(xx, {
         mount(res) {

            // n.ajax({
            //    url: 'http://localhost/api/test',
            //    headers: {
            //       Authorization:
            //          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0IiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdCIsImlhdCI6MTc2NjE3NTk2OSwiZXhwIjoxNzY2MTc5NTY5LCJkYXRhIjp7Im5hbWUiOiJ3aWRvZG8ifX0.dbQqF41I1ifbIBGvtRVXaarJN_ADqdS7Qr-6A6I1Ld0",
            //    },
            //    success: (res) => {
            //       log('SUCCESS', res)
            //    },
            //    error: (err) => {
            //       log('ERROR', err)
            //    }
            // });


            n('.login form').on('submit', function (ev) {
               ev.preventDefault();
               n.ajax({
                  url: buildURL('login'),
                  data: n(this).serialize(),
                  method: 'POST',
                  success: (res) => {
                     log('SUCCESS', res)
                  },
                  error: (err) => {
                     log('ERROR', err)
                  }
               });
               // const email = this.querySelector('#email').value;
               // const password = this.querySelector('#password').value;
               // n.location('auth/login', { email, password });
            });

            const client = google.accounts.oauth2.initTokenClient({
               client_id: '598543379687-1o9bsasf8sialvhb0j8llndbhjgbgl6u.apps.googleusercontent.com',
               scope: 'email profile',
               callback: (res) => {
                  // log(res)
                  n.loader({
                     target: d.body,
                     logo: buildURL('assets/images/logo.png'),
                  });
                  n.ajax({
                     url: buildURL('api/google'),
                     data: { access_token: res.access_token },
                     method: 'POST',
                     success: (res) => {
                        log('GOOGLE', res)
                        n.location('otp', { otp: res.data });
                     },
                     error: (err) => {
                        log('GOOGLE ERROR', err)
                     },
                     always: () => {
                        n(d.body).stopLoader();
                     }
                  });
               }
            });
            d.querySelector('#googleLogin')?.addEventListener('click', () => {
               client.requestAccessToken(); // 🔥 INI YANG MEMUNCULKAN POPUP
            });
         }
      });
   },
});