//google auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['email','profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login'},),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log(req.session.passport.user,"This is session");
    // res.redirect('/user/index');
    res.redirect('');
  }
);