const express = require('express')
const app = express()
const cors = require('cors');
var path = require('path'); 
var auth = require('./lib/auth');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var request = require('request');
var tokenKey = "f$i1nt#ec1hT@oke1n!Key"
const router = express.Router();
router.get('/', cors(), (req, res) => { res.send('cors!') });
//--------------------------------------------------
var connection = mysql.createConnection({
  host     : 'jun-db.c3y149arg7u0.ap-northeast-2.rds.amazonaws.com',
  user     : 'Jun',
  password : 'Akfwk!3524',
  database : 'mufin'
});
 
connection.connect();
 
connection.query('SELECT * FROM customer_info', function (error, results, fields) {
  if (error) throw error;
//   console.log('The solution is: ', results);
});

connection.query('SELECT * FROM financial_info', function (error, results, fields) {
    if (error) throw error;
    //console.log('The solution is: ', results);
  });

connection.query("SELECT * FROM center_info", function(err, results, field){
    // console.log(results);
})
 
// connection.end();
//------------------------------------------------

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : false}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('main')
})

app.get('/index', function (req, res) {
    res.render('index')
})

app.get("/login", function(req,res){
    res.render('login')
})

app.get('/mypage', function (req, res) {
    res.render('mypage')
})

app.get('/financial_products', function(req, res){
    res.render('financial_products');
  })

app.get('/qrcode', function(req, res){
    res.render('qrcode')
})

app.get('/payment', function(req, res){
    res.render('payment')
})

app.get('/trainer', function(req, res){
    res.render('trainer')
})

app.get('/tr_payment', function(req, res){
    res.render('tr_payment')
})

app.post('/', function(req, res){
    var sql = "SELECT * FROM customer_info";
    connection.query(sql, function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            res.json(result);
        }
    })
 })
 app.post('/tr_payment', function(req, res){
    //console.log(req.body)
    var id = req.body.id
    var sql = 'SELECT * FROM trainer_info where trainer_id = ?';
    connection.query(sql ,[id],function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            console.log(result)
            res.json(result);
        }
    })
 })
 app.post('/trainer', function(req,res){
    var sql = "SELECT * FROM trainer_info";
    connection.query(sql, function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            res.json(result);
        }
    })
 })
 app.get('/transfer', function(req, res){
    console.log(req.query)
    var Id = req.query.userID;
    var finNum = req.query.finNum;
    console.log(Id)
    console.log(finNum)

    var sql = "SELECT customer_name, userseqnum, accessToken FROM customer_info WHERE customer_ID = ?";
    connection.query(sql,[Id], function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            console.log(result[0].accessToken);
            var option = {
                method : "POST",
                url :'https://testapi.open-platform.or.kr/transfer/withdraw',
                headers : {
                    'Authorization' : 'Bearer ' + result[0].accessToken,
                    'Content-Type' : 'application/json; charset=UTF-8'
                },
                json : {
                    dps_print_content : '헬스장 이용',
                    fintech_use_num : finNum,
                    tran_amt : 150000,
                    print_content : '헬스장 이용료',
                    tran_dtime : '20190523101921'
                }
            };
            request(option, function(err, response, body){
                if(err) throw err;
                else {
                    if(body.rsp_code == "A0000"){
                        sql = 'INSERT INTO billing_info VALUES (?, ?, ?, ?, ?, ?, ?);'
                        var ID_billing = body.bank_tran_id
                        var customer_id = Id
                        var account = body.account_num_masked
                        var bank = body.dps_bank_name
                        var name = body.account_holder_name
                        var date = body.bank_tran_date
                        var amount = body.tran_amt
                        var params = [ID_billing, customer_id, account, bank, name, date, amount];
                        connection.query(sql,params, function(err, result){
                            if(err){
                                console.error(err);
                                throw err;
                            }
                            else {
                            }
                        })
                        console.log(result[0].customer_name + ' 님이 '+body.tran_amt + "원을 결제를 했습니다!!")
                        res.render('transfer')
                        //res.json("결제가 완료되었습니다.")
                    }
                    else {
                    }
                }
            })
        }
    })
})
 app.post('/withdrawQR', auth, function (req, res) {
    var userId = req.decoded.userId;
    var finNum = req.body.qrFin;

    var sql = "SELECT customer_ID,customer_name, userseqnum, accessToken FROM customer_info WHERE customer_ID = ?";
    connection.query(sql,[userId], function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            var option = {
                method : "POST",
                url :'https://testapi.open-platform.or.kr/transfer/withdraw',
                headers : {
                    'Authorization' : 'Bearer ' + result[0].accessToken,
                    'Content-Type' : 'application/json; charset=UTF-8'
                },
                json : {
                    dps_print_content : '헬스장 이용',
                    fintech_use_num : finNum,
                    tran_amt : 150000,
                    print_content : '헬스장 이용료',
                    tran_dtime : '20190523101921'
                }
            };
            request(option, function(err, response, body){
                if(err) throw err;
                else {
                    if(body.rsp_code == "A0000"){
                        console.log(result[0].customer_ID +"("+result[0].customer_name+")"+" 님이 헬스장에 입장하셨습니다 !!")
                        res.json(1);
                    }
                    else {
                        res.json(2);
                    }
                }
            })
        }
    })
})

app.post('/login', function (req, res, next) {
    var userEmail = req.body.email;
    var userPassword = req.body.password;

    var sql = "SELECT * FROM customer_info WHERE customer_ID = ?";
    connection.query(sql, [userEmail], function (error, results) {
      if (error) throw error;  
      else {
        if(userPassword == results[0].password){
            jwt.sign(
                {
                    userName : results[0].customer_name,
                    userId : results[0].customer_ID
                },
                tokenKey,
                {
                    expiresIn : '1d',
                    issuer : 'fintech.admin',
                    subject : 'user.login.info'
                },
                function(err, token){
                    console.log(results[0].customer_name +"님이 로그인 하셨습니다 !!")
                    res.json(token)
                   
                }
            )            
        }
        else {
            console.log("로그인 실패!!!")
            res.json('등록정보가 없습니다');
        }
      }
    });
})

app.post('/index', function(req, res){
    var sql = "SELECT * FROM center_info";
    connection.query(sql, function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            res.json(result);
        }
    })
 })

app.post('/mypage',auth, function(req, res){
    var pageuserId = req.decoded.userId;
    //console.log(req.decoded)
    // var sql = "SELECT * FROM customer_info";
    var sql ="SELECT DISTINCT * from billing_info JOIN customer_info where  billing_info.customer_id=customer_info.customer_ID and  customer_info.customer_ID = ?"
    connection.query(sql,[pageuserId], function(err, result){
        if(err){
            console.log("!!!!!!!")
            console.error(err);
            throw err;
        }
        else {
            res.json(result);
        }
    })
 })

 app.post('/financial_products', function(req,res){
    connection.query("SELECT * FROM financial_info", function(err, result){
        if(err){
            console.error(err);
            throw err;
        }
        else {
        //   console.log(result);
            res.json(result);
        }
    })
  })



/*
app.get('/signup', function(req, res){
    res.render('signup');
})

app.post('/signup', function(req, res){
    var name = req.body.nameinput;
    var email = req.body.emailinput;
    console.log(name, email);
})

app.get('/sayHello', function(req, res){
    res.send("say Hello");
})

app.get('/sayHello2', function(req, res){
    res.send("say Hello2");
})
*/

app.listen(3000, function(){
    console.log("Connected localhost:3000");
})