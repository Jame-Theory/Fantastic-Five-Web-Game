

function LoginPage() {

    const onLogin = () => {
        window.location.replace('')
    }

    return (
        <div>
            <form action="/form-path" method="post" onSubmit={() => { onLogin() }}>
                <label>Username:<br/>
                    <input type="text" name="username"></input><br/>
                </label>

                <label>Password:<br/>
                    <input type="text" name="password"></input><br/>
                </label>

                <input type="submit" value="Submit"></input>

            </form>
        </div>
    )
}

export default LoginPage;