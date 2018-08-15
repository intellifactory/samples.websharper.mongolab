// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
var JSON;JSON||(JSON={}),function(){"use strict";function i(n){return n<10?"0"+n:n}function f(n){return o.lastIndex=0,o.test(n)?'"'+n.replace(o,function(n){var t=s[n];return typeof t=="string"?t:"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+n+'"'}function r(i,e){var s,l,h,a,v=n,c,o=e[i];o&&typeof o=="object"&&typeof o.toJSON=="function"&&(o=o.toJSON(i)),typeof t=="function"&&(o=t.call(e,i,o));switch(typeof o){case"string":return f(o);case"number":return isFinite(o)?String(o):"null";case"boolean":case"null":return String(o);case"object":if(!o)return"null";if(n+=u,c=[],Object.prototype.toString.apply(o)==="[object Array]"){for(a=o.length,s=0;s<a;s+=1)c[s]=r(s,o)||"null";return h=c.length===0?"[]":n?"[\n"+n+c.join(",\n"+n)+"\n"+v+"]":"["+c.join(",")+"]",n=v,h}if(t&&typeof t=="object")for(a=t.length,s=0;s<a;s+=1)typeof t[s]=="string"&&(l=t[s],h=r(l,o),h&&c.push(f(l)+(n?": ":":")+h));else for(l in o)Object.prototype.hasOwnProperty.call(o,l)&&(h=r(l,o),h&&c.push(f(l)+(n?": ":":")+h));return h=c.length===0?"{}":n?"{\n"+n+c.join(",\n"+n)+"\n"+v+"}":"{"+c.join(",")+"}",n=v,h}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+i(this.getUTCMonth()+1)+"-"+i(this.getUTCDate())+"T"+i(this.getUTCHours())+":"+i(this.getUTCMinutes())+":"+i(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var e=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,o=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,n,u,s={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},t;typeof JSON.stringify!="function"&&(JSON.stringify=function(i,f,e){var o;if(n="",u="",typeof e=="number")for(o=0;o<e;o+=1)u+=" ";else typeof e=="string"&&(u=e);if(t=f,f&&typeof f!="function"&&(typeof f!="object"||typeof f.length!="number"))throw new Error("JSON.stringify");return r("",{"":i})}),typeof JSON.parse!="function"&&(JSON.parse=function(n,t){function r(n,i){var f,e,u=n[i];if(u&&typeof u=="object")for(f in u)Object.prototype.hasOwnProperty.call(u,f)&&(e=r(u,f),e!==undefined?u[f]=e:delete u[f]);return t.call(n,i,u)}var i;if(n=String(n),e.lastIndex=0,e.test(n)&&(n=n.replace(e,function(n){return"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})),/^[\],:{}\s]*$/.test(n.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return i=eval("("+n+")"),typeof t=="function"?r({"":i},""):i;throw new SyntaxError("JSON.parse");})}();;
(function()
{
 "use strict";
 var Global,Notes,Client,WebSharper,Operators,MongoLab,Variables,Html,Client$1,Operators$1,Tags,Attr,EventsPervasives,Obj,AttributeBuilder,Piglets,Pervasives,Piglet,Note,Functions,Types,Database,Collection,Controls,EventTarget,Pagelet,JavaScript,Pervasives$1,SC$1,Element,Arrays,TagBuilder,SC$2,Stream,Reader,Result,Submitter,Concurrency,PushableCollection,List,T,Node,WindowOrWorkerGlobalScope,Enumerator,Text,SC$3,Attribute,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,IntelliFactory,Reactive,HotStream,ErrorMessage,Id,ConcreteWriter,AsyncBody,Ref,Unchecked,Constraint,Object,SC$4,SC$5,CT,Events,JQueryEventSupport,Control,FSharpEvent,SC$6,Scheduler,Condition,Seq,CancellationTokenSource,Util,T$1,Error,OperationCanceledException,InvalidOperationException,Event,Event$1,Collections,List$1,Runtime,Date,$,JSON,console;
 Global=self;
 Notes=Global.Notes=Global.Notes||{};
 Client=Notes.Client=Notes.Client||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 MongoLab=WebSharper.MongoLab=WebSharper.MongoLab||{};
 Variables=MongoLab.Variables=MongoLab.Variables||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client$1=Html.Client=Html.Client||{};
 Operators$1=Client$1.Operators=Client$1.Operators||{};
 Tags=Client$1.Tags=Client$1.Tags||{};
 Attr=Client$1.Attr=Client$1.Attr||{};
 EventsPervasives=Client$1.EventsPervasives=Client$1.EventsPervasives||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 AttributeBuilder=Client$1.AttributeBuilder=Client$1.AttributeBuilder||{};
 Piglets=WebSharper.Piglets=WebSharper.Piglets||{};
 Pervasives=Piglets.Pervasives=Piglets.Pervasives||{};
 Piglet=Piglets.Piglet=Piglets.Piglet||{};
 Note=Client.Note=Client.Note||{};
 Functions=MongoLab.Functions=MongoLab.Functions||{};
 Types=MongoLab.Types=MongoLab.Types||{};
 Database=Types.Database=Types.Database||{};
 Collection=Types.Collection=Types.Collection||{};
 Controls=Piglets.Controls=Piglets.Controls||{};
 EventTarget=Global.EventTarget;
 Pagelet=Client$1.Pagelet=Client$1.Pagelet||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives$1=JavaScript.Pervasives=JavaScript.Pervasives||{};
 SC$1=Global.StartupCode$WebSharper_MongoLab$Variables=Global.StartupCode$WebSharper_MongoLab$Variables||{};
 Element=Client$1.Element=Client$1.Element||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 TagBuilder=Client$1.TagBuilder=Client$1.TagBuilder||{};
 SC$2=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 Stream=Piglets.Stream=Piglets.Stream||{};
 Reader=Piglets.Reader=Piglets.Reader||{};
 Result=Piglets.Result=Piglets.Result||{};
 Submitter=Piglets.Submitter=Piglets.Submitter||{};
 Concurrency=WebSharper.Concurrency=WebSharper.Concurrency||{};
 PushableCollection=Types.PushableCollection=Types.PushableCollection||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 Node=Global.Node;
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 Text=Client$1.Text=Client$1.Text||{};
 SC$3=Global.StartupCode$WebSharper_Html_Client$Events=Global.StartupCode$WebSharper_Html_Client$Events||{};
 Attribute=Client$1.Attribute=Client$1.Attribute||{};
 Implementation=Client$1.Implementation=Client$1.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder||{};
 IntelliFactory=Global.IntelliFactory=Global.IntelliFactory||{};
 Reactive=IntelliFactory.Reactive=IntelliFactory.Reactive||{};
 HotStream=Reactive.HotStream=Reactive.HotStream||{};
 ErrorMessage=Piglets.ErrorMessage=Piglets.ErrorMessage||{};
 Id=Piglets.Id=Piglets.Id||{};
 ConcreteWriter=Piglets.ConcreteWriter=Piglets.ConcreteWriter||{};
 AsyncBody=Concurrency.AsyncBody=Concurrency.AsyncBody||{};
 Ref=WebSharper.Ref=WebSharper.Ref||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Constraint=Types.Constraint=Types.Constraint||{};
 Object=Global.Object;
 SC$4=Global.StartupCode$Notes$Client=Global.StartupCode$Notes$Client||{};
 SC$5=Global.StartupCode$WebSharper_Main$Concurrency=Global.StartupCode$WebSharper_Main$Concurrency||{};
 CT=Concurrency.CT=Concurrency.CT||{};
 Events=Client$1.Events=Client$1.Events||{};
 JQueryEventSupport=Events.JQueryEventSupport=Events.JQueryEventSupport||{};
 Control=WebSharper.Control=WebSharper.Control||{};
 FSharpEvent=Control.FSharpEvent=Control.FSharpEvent||{};
 SC$6=Global.StartupCode$WebSharper_Piglets$Piglets=Global.StartupCode$WebSharper_Piglets$Piglets||{};
 Scheduler=Concurrency.Scheduler=Concurrency.Scheduler||{};
 Condition=Types.Condition=Types.Condition||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 CancellationTokenSource=WebSharper.CancellationTokenSource=WebSharper.CancellationTokenSource||{};
 Util=WebSharper.Util=WebSharper.Util||{};
 T$1=Enumerator.T=Enumerator.T||{};
 Error=Global.Error;
 OperationCanceledException=WebSharper.OperationCanceledException=WebSharper.OperationCanceledException||{};
 InvalidOperationException=WebSharper.InvalidOperationException=WebSharper.InvalidOperationException||{};
 Event=Control.Event=Control.Event||{};
 Event$1=Event.Event=Event.Event||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 List$1=Collections.List=Collections.List||{};
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 Date=Global.Date;
 $=Global.jQuery;
 JSON=Global.JSON;
 console=Global.console;
 Client.Main=function()
 {
  var self$1,a,a$1,a$2,x,a$3,a$4,a$5,a$6;
  function a$7(a$9,a$10)
  {
   Global.jQuery("#form").toggleClass("visible");
  }
  function a$8(x$1,y,z)
  {
   var a$9,a$10,a$11,a$12;
   return Operators$1.add((a$9=[Attr.Attr().NewAttr("id","form")],Tags.Tags().NewTag("div",a$9)),[Operators$1.add((a$10=[Attr.Attr().NewAttr("class","container")],Tags.Tags().NewTag("div",a$10)),[(a$11=[Tags.Tags().text("Title")],Tags.Tags().NewTag("label",a$11)),Controls.input("text",Global.id,Global.id,x$1),Operators$1.add(Controls.TextArea(y),[Attr.Attr().NewAttr("rows","4")]),(a$12=[Operators$1.add(Controls.Submit(z),[Attr.Attr().NewAttr("value","Save")])],Tags.Tags().NewTag("div",a$12))])]);
  }
  (Variables.Key())[0]="pS_nPkhL6Co1H2sLRuovMj7rz5XEVMMF";
  self$1=Operators$1.add((a=[Attr.Attr().NewAttr("id","wrapper")],Tags.Tags().NewTag("div",a)),[Operators$1.add((a$1=[Attr.Attr().NewAttr("id","header")],Tags.Tags().NewTag("div",a$1)),[(a$2=[Tags.Tags().text("Notes")],Tags.Tags().NewTag("h1",a$2)),(x=(a$3=[Tags.Tags().text("+ New")],Tags.Tags().NewTag("button",a$3)),(function(a$9)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a$7($1,$2);
    };
   },a$9);
  }(x),x)),(a$4=[Attr.Attr().NewAttr("class","fix")],Tags.Tags().NewTag("div",a$4))]),Piglet.Render(Runtime.Curried3(a$8),Piglet.Run(function(note)
  {
   var b;
   Concurrency.Start((b=null,Concurrency.Delay(function()
   {
    return Concurrency.Bind(Functions.Push(note,Functions.op_GreaterMinus(new Database.New("websharper"),new Collection.New("Notes"))),function(a$9)
    {
     return a$9?(Global.alert("Saved!"),Client.loadNotes(),Concurrency.Zero()):Concurrency.Zero();
    });
   })),null);
  },Piglet.WithSubmit(Pervasives.op_LessMultiplyGreater(Pervasives.op_LessMultiplyGreater(Piglet.Return(function(title)
  {
   return function(text)
   {
    return Note.New(title,Date.now(),text);
   };
  }),Piglet.Yield("")),Piglet.Yield(""))))),Operators$1.add((a$5=[Attr.Attr().NewAttr("id","notes")],Tags.Tags().NewTag("div",a$5)),[(a$6=[Attr.Attr().NewAttr("src","loading.gif")],Tags.Tags().NewTag("img",a$6))])]);
  self.document.body.appendChild(self$1.get_Body());
  Client.loadNotes();
 };
 Client.loadNotes=function()
 {
  var b;
  Concurrency.Start((b=null,Concurrency.Delay(function()
  {
   return Concurrency.Bind(Functions.Fetch(Functions.op_GreaterMinus(new Database.New("websharper"),new Collection.New("Notes"))),function(a)
   {
    var self$1,x,a$1,wrapper;
    self$1=(x=Arrays.map(function(note)
    {
     var date,a$2,a$3,a$4,x$1,c,c$1,a$5;
     date=new Date(note.Date);
     return Operators$1.add((a$2=[Attr.Attr().NewAttr("class","note")],Tags.Tags().NewTag("div",a$2)),[(a$3=[Tags.Tags().text(note.Title)],Tags.Tags().NewTag("h2",a$3)),(a$4=[(x$1=Client.months().get_Item(date.getMonth())+" "+(c=date.getDate(),Global.String(c))+", "+(c$1=date.getFullYear(),Global.String(c$1)),Tags.Tags().text(x$1))],Tags.Tags().NewTag("span",a$4)),(a$5=[Tags.Tags().text(note.Text)],Tags.Tags().NewTag("p",a$5))]);
    },a),Operators$1.add((a$1=[Attr.Attr().NewAttr("id","notes")],Tags.Tags().NewTag("div",a$1)),x));
    wrapper=self.document.getElementById("wrapper");
    wrapper.replaceChild(self$1.get_Body(),wrapper.lastChild);
    return Concurrency.Zero();
   });
  })),null);
 };
 Client.months=function()
 {
  SC$4.$cctor();
  return SC$4.months;
 };
 Operators.InvalidOp=function(msg)
 {
  throw new InvalidOperationException.New(msg);
 };
 Operators.FailWith=function(msg)
 {
  throw new Error(msg);
 };
 Variables.Key=function()
 {
  SC$1.$cctor();
  return SC$1.Key;
 };
 Variables.BaseUrl=function()
 {
  SC$1.$cctor();
  return SC$1.BaseUrl;
 };
 Operators$1.add=function(el,inner)
 {
  var e;
  e=Enumerator.Get(inner);
  try
  {
   while(e.MoveNext())
    el.AppendI(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return el;
 };
 Tags.Tags=function()
 {
  SC$2.$cctor();
  return SC$2.Tags$1;
 };
 Attr.Attr=function()
 {
  SC$2.$cctor();
  return SC$2.Attr$1;
 };
 EventsPervasives.Events=function()
 {
  SC$3.$cctor();
  return SC$3.Events;
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 AttributeBuilder=Client$1.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 Pervasives.op_LessMultiplyGreater=function(f,x)
 {
  var f$1,g;
  return Piglet.New(Stream.Ap(f.stream,x.stream),(f$1=f.view,(g=x.view,function(x$1)
  {
   return g(f$1(x$1));
  })));
 };
 Piglet.Return=function(x)
 {
  return Piglet.New(new Stream.New(new Result({
   $:0,
   $0:x
  }),null),Global.id);
 };
 Piglet.Yield=function(x)
 {
  var s;
  s=new Stream.New(new Result({
   $:0,
   $0:x
  }),null);
  return Piglet.New(s,function(f)
  {
   return f(s);
  });
 };
 Piglet.WithSubmit=function(pin)
 {
  var submitter;
  function v($1,$2)
  {
   return(pin.view($1))($2);
  }
  submitter=new Submitter.New(pin.stream,false);
  return Piglet.New(submitter.get_Output(),function(x)
  {
   return v(x,submitter);
  });
 };
 Piglet.Run=function(action,p)
 {
  return Piglet.RunResult(Result.Iter(action),p);
 };
 Piglet.Render=function(view,p)
 {
  return p.view(view);
 };
 Piglet.RunResult=function(action,p)
 {
  p.stream.Subscribe(action);
  return p;
 };
 Note.New=function(Title,Date$1,Text$1)
 {
  return{
   Title:Title,
   Date:Date$1,
   Text:Text$1
  };
 };
 Functions.op_GreaterMinus=function(database,collection)
 {
  return new PushableCollection.New(collection.get_Name(),database);
 };
 Functions.Push=function(data,collection)
 {
  return Concurrency.FromContinuations(function(ok)
  {
   var r;
   $.ajax((Variables.BaseUrl())[0]+Collection.ToString(collection)+"&apiKey="+(Variables.Key())[0],(r={},r.type="POST",r.data=JSON.stringify(data),r.success=function()
   {
    return ok(true);
   },r.headers={
    "Content-Type":"application/json"
   },r));
  });
 };
 Functions.Fetch=function(collection)
 {
  return Concurrency.FromContinuations(function(ok)
  {
   $.getJSON((Variables.BaseUrl())[0]+Collection.ToString(collection)+"&apiKey="+(Variables.Key())[0],null,function(result)
   {
    return ok(result);
   });
  });
 };
 Database=Types.Database=Runtime.Class({
  get_Name:function()
  {
   return this.name;
  }
 },Obj,Database);
 Database.New=Runtime.Ctor(function(name)
 {
  Obj.New.call(this);
  this.name=name;
 },Database);
 Collection=Types.Collection=Runtime.Class({
  get_Name:function()
  {
   return this.name;
  },
  set_Database:function(v)
  {
   this.Database=v;
  },
  get_Database:function()
  {
   return this.Database;
  },
  get_Constraint:function()
  {
   return this.Constraint;
  }
 },Obj,Collection);
 Collection.ToString=function(collection)
 {
  return"/databases/"+collection.get_Database().$0.get_Name()+"/collections/"+collection.get_Name()+"?q="+(Constraint.get_ToString())(collection.get_Constraint());
 };
 Collection.New=Runtime.Ctor(function(name)
 {
  Obj.New.call(this);
  this.name=name;
  this.Database=null;
  this.Constraint=null;
  this.Sorts=T.Empty;
 },Collection);
 Controls.TextArea=function(stream)
 {
  var i,m;
  function ev(a)
  {
   stream.Trigger(new Result({
    $:0,
    $0:i.get_Value()
   }));
  }
  i=Tags.Tags().NewTag("textarea",[]);
  m=stream.get_Latest();
  m.$==0?i.set_Value(m.$0):void 0;
  stream.Subscribe(function(a)
  {
   var x;
   if(a.$==1)
    ;
   else
    {
     x=a.$0;
     i.get_Value()!==x?i.set_Value(x):void 0;
    }
  });
  i.get_Body().addEventListener("keyup",ev,true);
  i.get_Body().addEventListener("change",ev,true);
  return i;
 };
 Controls.Submit=function(submit)
 {
  var x;
  function a(a$1,a$2)
  {
   return submit.WebSharper_Piglets_Writer_1$Trigger(new Result({
    $:0,
    $0:null
   }));
  }
  x=Tags.Tags().NewTag("input",[Attr.Attr().NewAttr("type","submit")]);
  (function(a$1)
  {
   EventsPervasives.Events().OnClick(function($1)
   {
    return function($2)
    {
     return a($1,$2);
    };
   },a$1);
  }(x));
  return x;
 };
 Controls.input=function(type,ofString,toString,stream)
 {
  var i,m;
  function ev(a)
  {
   var v;
   v=new Result({
    $:0,
    $0:ofString(i.get_Value())
   });
   !Unchecked.Equals(v,stream.get_Latest())?stream.Trigger(v):void 0;
  }
  i=Tags.Tags().NewTag("input",[Attr.Attr().NewAttr("type",type)]);
  m=stream.get_Latest();
  m.$==0?i.set_Value(toString(m.$0)):void 0;
  stream.Subscribe(function(a)
  {
   var s;
   if(a.$==1)
    ;
   else
    {
     s=toString(a.$0);
     i.get_Value()!==s?i.set_Value(s):void 0;
    }
  });
  i.get_Body().addEventListener("keyup",ev,true);
  i.get_Body().addEventListener("change",ev,true);
  return i;
 };
 Pagelet=Client$1.Pagelet=Runtime.Class({
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Pervasives$1.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.BaseUrl=["https://api.mongolab.com/api/1"];
  SC$1.Key=[""];
 };
 Element=Client$1.Element=Runtime.Class({
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  },
  set_Value:function(x)
  {
   this.HtmlProvider.SetValue(this.get_Body(),x);
  },
  get_Value:function()
  {
   return this.HtmlProvider.GetValue(this.get_Body());
  },
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  }
 },Pagelet,Element);
 Element.New=function(html,name)
 {
  var el,dom;
  el=new Element.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element);
 WebSharper.checkThis=function(_this)
 {
  return Unchecked.Equals(_this,null)?Operators.InvalidOp("The initialization of an object or value resulted in an object or value being accessed recursively before it was fully initialized."):_this;
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 TagBuilder=Client$1.TagBuilder=Runtime.Class({
  text:function(data)
  {
   return new Text.New(data);
  },
  NewTag:function(name,children)
  {
   var el,e;
   el=Element.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.HtmlProvider=new JQueryHtmlProvider.New();
  SC$2.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$2.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$2.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$2.Tags$1=Implementation.Tags();
  SC$2.Deprecated=Implementation.DeprecatedHtml();
  SC$2.Attr$1=Implementation.Attr();
 };
 Piglet=Piglets.Piglet=Runtime.Class({},null,Piglet);
 Piglet.New=function(stream,view)
 {
  return new Piglet({
   stream:stream,
   view:view
  });
 };
 Stream.Ap=function(sf,sx)
 {
  var out;
  out=new Stream.New(Result.Ap(sf.get_Latest(),sx.get_Latest()),null);
  sf.Subscribe(function(f)
  {
   out.Trigger(Result.Ap(f,sx.get_Latest()));
  });
  sx.Subscribe(function(x)
  {
   out.Trigger(Result.Ap(sf.get_Latest(),x));
  });
  return out;
 };
 Reader=Piglets.Reader=Runtime.Class({},Obj,Reader);
 Reader.New=Runtime.Ctor(function(id)
 {
  Obj.New.call(this);
  this.id=id;
 },Reader);
 Stream=Piglets.Stream=Runtime.Class({
  Trigger:function(x)
  {
   this.s.Trigger(x);
  },
  get_Latest:function()
  {
   return this.s.Latest[0].$0;
  },
  Subscribe:function(f)
  {
   return this.s.Subscribe(Util.observer(f));
  },
  WebSharper_Piglets_Writer_1$Trigger:function(x)
  {
   this.Trigger(x);
  }
 },Reader,Stream);
 Stream.New=Runtime.Ctor(function(init,id)
 {
  Stream.New$1.call(this,HotStream.New$1(init),id);
 },Stream);
 Stream.New$1=Runtime.Ctor(function(s,id)
 {
  Reader.New.call(this,id==null?(Id.next())():id.$0);
  this.s=s;
 },Stream);
 Result=Piglets.Result=Runtime.Class({},null,Result);
 Result.Iter=function(f)
 {
  return function(a)
  {
   if(a.$==1)
    ;
   else
    f(a.$0);
  };
 };
 Result.Ap=function(r1,r2)
 {
  var $1;
  switch(r1.$==1?r2.$==1?($1=[r1.$0,r2.$0],2):($1=r1.$0,1):r2.$==1?($1=r2.$0,1):($1=[r1.$0,r2.$0],0))
  {
   case 0:
    return new Result({
     $:0,
     $0:$1[0]($1[1])
    });
   case 1:
    return new Result({
     $:1,
     $0:$1
    });
   case 2:
    return new Result({
     $:1,
     $0:List.append($1[0],$1[1])
    });
  }
 };
 Submitter=Piglets.Submitter=Runtime.Class({
  get_Output:function()
  {
   return this.output;
  },
  get_Latest:function()
  {
   return this.output.get_Latest();
  },
  Subscribe:function(f)
  {
   return this.output.Subscribe(f);
  },
  WebSharper_Piglets_Writer_1$Trigger:function(x)
  {
   this.writer.WebSharper_Piglets_Writer_1$Trigger(x);
  }
 },Reader,Submitter);
 Submitter.New=Runtime.Ctor(function(input,clearError)
 {
  var $this;
  $this=this;
  Reader.New.call(this,(Id.next())());
  this.input=input;
  this.output=new Stream.New(new Result({
   $:1,
   $0:T.Empty
  }),null);
  this.writer=new ConcreteWriter.New$1(function(unitIn)
  {
   var $1,$2;
   $2=$this.input.get_Latest();
   switch(unitIn.$==0?$2.$==0?($1=$2.$0,2):($1=$2.$0,1):$2.$==0?($1=unitIn.$0,1):($1=[unitIn.$0,$2.$0],0))
   {
    case 0:
     $this.output.Trigger(new Result({
      $:1,
      $0:List.append($1[0],$1[1])
     }));
     break;
    case 1:
     $this.output.Trigger(new Result({
      $:1,
      $0:$1
     }));
     break;
    case 2:
     $this.output.Trigger(new Result({
      $:0,
      $0:$1
     }));
     break;
   }
  });
  clearError?this.input.Subscribe(function()
  {
   var m,$1;
   m=$this.output.get_Latest();
   m.$==1&&m.$0.$==0?void 0:$this.output.Trigger(new Result({
    $:1,
    $0:T.Empty
   }));
  }):void 0;
 },Submitter);
 Concurrency.Delay=function(mk)
 {
  return function(c)
  {
   try
   {
    (mk(null))(c);
   }
   catch(e)
   {
    c.k({
     $:1,
     $0:e
    });
   }
  };
 };
 Concurrency.Bind=function(r,f)
 {
  return Concurrency.checkCancel(function(c)
  {
   r(AsyncBody.New(function(a)
   {
    var x;
    if(a.$==0)
     {
      x=a.$0;
      Concurrency.scheduler().Fork(function()
      {
       try
       {
        (f(x))(c);
       }
       catch(e)
       {
        c.k({
         $:1,
         $0:e
        });
       }
      });
     }
    else
     Concurrency.scheduler().Fork(function()
     {
      c.k(a);
     });
   },c.ct));
  });
 };
 Concurrency.Zero=function()
 {
  SC$5.$cctor();
  return SC$5.Zero;
 };
 Concurrency.Start=function(c,ctOpt)
 {
  var ct,d;
  ct=(d=(Concurrency.defCTS())[0],ctOpt==null?d:ctOpt.$0);
  Concurrency.scheduler().Fork(function()
  {
   if(!ct.c)
    c(AsyncBody.New(function(a)
    {
     if(a.$==1)
      Concurrency.UncaughtAsyncError(a.$0);
    },ct));
  });
 };
 Concurrency.checkCancel=function(r)
 {
  return function(c)
  {
   if(c.ct.c)
    Concurrency.cancel(c);
   else
    r(c);
  };
 };
 Concurrency.FromContinuations=function(subscribe)
 {
  return function(c)
  {
   var continued;
   function once(cont)
   {
    if(continued[0])
     Operators.FailWith("A continuation provided by Async.FromContinuations was invoked multiple times");
    else
     {
      continued[0]=true;
      Concurrency.scheduler().Fork(cont);
     }
   }
   continued=[false];
   subscribe(function(a)
   {
    once(function()
    {
     c.k({
      $:0,
      $0:a
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:1,
      $0:e
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:2,
      $0:e
     });
    });
   });
  };
 };
 Concurrency.defCTS=function()
 {
  SC$5.$cctor();
  return SC$5.defCTS;
 };
 Concurrency.UncaughtAsyncError=function(e)
 {
  console.log("WebSharper: Uncaught asynchronous exception",e);
 };
 Concurrency.cancel=function(c)
 {
  c.k({
   $:2,
   $0:new OperationCanceledException.New(c.ct)
  });
 };
 Concurrency.scheduler=function()
 {
  SC$5.$cctor();
  return SC$5.scheduler;
 };
 Concurrency.Return=function(x)
 {
  return function(c)
  {
   c.k({
    $:0,
    $0:x
   });
  };
 };
 PushableCollection=Types.PushableCollection=Runtime.Class({},Collection,PushableCollection);
 PushableCollection.New=Runtime.Ctor(function(name,database)
 {
  Collection.New.call(this,name);
  this[0]=this;
  this.init=1;
  WebSharper.checkThis(this[0]).set_Database({
   $:1,
   $0:database
  });
 },PushableCollection);
 T=List.T=Runtime.Class({
  get_Item:function(x)
  {
   return Seq.nth(x,this);
  },
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Text=Client$1.Text=Runtime.Class({
  get_Body:function()
  {
   return self.document.createTextNode(this.text);
  }
 },Pagelet,Text);
 Text.New=Runtime.Ctor(function(text)
 {
  Pagelet.New.call(this);
  this.text=text;
 },Text);
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.Events=new JQueryEventSupport.New();
 };
 Attribute=Client$1.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=$(node);
   a=$(el);
   _this.append.apply(_this,[a]);
  },
  SetValue:function(node,value)
  {
   $(node).val(value);
  },
  GetValue:function(node)
  {
   return $(node).val();
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  },
  SetAttribute:function(node,name,value)
  {
   $(node).attr(name,value);
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$2.$cctor();
  return SC$2.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$2.$cctor();
  return SC$2.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$2.$cctor();
  return SC$2.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$2.$cctor();
  return SC$2.Attr;
 };
 DeprecatedTagBuilder=Client$1.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 HotStream=Reactive.HotStream=Runtime.Class({
  Trigger:function(v)
  {
   this.Latest[0]={
    $:1,
    $0:v
   };
   this.Event.event.Trigger(v);
  },
  Subscribe:function(o)
  {
   this.Latest[0]!=null?o.OnNext(this.Latest[0].$0):void 0;
   return this.Event.event.Subscribe(o);
  }
 },null,HotStream);
 HotStream.New$1=function(x)
 {
  return HotStream.New([{
   $:1,
   $0:x
  }],new FSharpEvent.New());
 };
 HotStream.New=function(Latest,Event$2)
 {
  return new HotStream({
   Latest:Latest,
   Event:Event$2
  });
 };
 ErrorMessage=Piglets.ErrorMessage=Runtime.Class({},Obj,ErrorMessage);
 Id.next=function()
 {
  SC$6.$cctor();
  return SC$6.next;
 };
 ConcreteWriter=Piglets.ConcreteWriter=Runtime.Class({
  WebSharper_Piglets_Writer_1$Trigger:function(x)
  {
   this.trigger(x);
  }
 },Obj,ConcreteWriter);
 ConcreteWriter.New$1=Runtime.Ctor(function(trigger)
 {
  Obj.New.call(this);
  this.trigger=trigger;
 },ConcreteWriter);
 AsyncBody.New=function(k,ct)
 {
  return{
   k:k,
   ct:ct
  };
 };
 Ref.New=function(contents)
 {
  return[contents];
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Date&&b instanceof Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Constraint.get_ToString=function()
 {
  return function(a)
  {
   function helper(a$1)
   {
    return a$1.$==1?"{$and:["+helper(a$1.$0)+","+helper(a$1.$1)+"]}":a$1.$==2?"{$or:["+helper(a$1.$0)+","+helper(a$1.$1)+"]}":Condition.ToString(a$1.$0,a$1.$1);
   }
   return a!=null&&a.$==1?helper(a.$0):"{}";
  };
 };
 List.append=function(x,y)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return y;
  else
   if(y.$==0)
    return x;
   else
    {
     res=new T({
      $:1
     });
     r=res;
     l=x;
     go=true;
     while(go)
      {
       r.$0=l.$0;
       l=l.$1;
       l.$==0?go=false:r=(t=new T({
        $:1
       }),r.$1=t,t);
      }
     r.$1=y;
     return res;
    }
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.months=List.ofArray(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]);
 };
 SC$5.$cctor=function()
 {
  SC$5.$cctor=Global.ignore;
  SC$5.noneCT=CT.New(false,[]);
  SC$5.scheduler=new Scheduler.New();
  SC$5.defCTS=[new CancellationTokenSource.New()];
  SC$5.Zero=Concurrency.Return();
  SC$5.GetCT=function(c)
  {
   c.k({
    $:0,
    $0:c.ct
   });
  };
 };
 CT.New=function(IsCancellationRequested,Registrations)
 {
  return{
   c:IsCancellationRequested,
   r:Registrations
  };
 };
 JQueryEventSupport=Events.JQueryEventSupport=Runtime.Class({
  OnMouse:function(name,f,el)
  {
   $(el.get_Body()).on(name,function(ev)
   {
    return f(el,{
     X:ev.pageX,
     Y:ev.pageY,
     Event:ev
    });
   });
  },
  OnClick:function(f,el)
  {
   this.OnMouse("click",function($1,$2)
   {
    return(f($1))($2);
   },el);
  }
 },Obj,JQueryEventSupport);
 JQueryEventSupport.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryEventSupport);
 FSharpEvent=Control.FSharpEvent=Runtime.Class({},Obj,FSharpEvent);
 FSharpEvent.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.event=Event$1.New([]);
 },FSharpEvent);
 SC$6.$cctor=function()
 {
  var current;
  SC$6.$cctor=Global.ignore;
  SC$6.next=(current=[0],function()
  {
   current[0]++;
   return current[0];
  });
 };
 Scheduler=Concurrency.Scheduler=Runtime.Class({
  Fork:function(action)
  {
   var $this;
   $this=this;
   this.robin.push(action);
   this.idle?(this.idle=false,Global.setTimeout(function()
   {
    $this.tick();
   },0)):void 0;
  },
  tick:function()
  {
   var loop,$this,t;
   $this=this;
   t=Date.now();
   loop=true;
   while(loop)
    if(this.robin.length===0)
     {
      this.idle=true;
      loop=false;
     }
    else
     {
      (this.robin.shift())();
      Date.now()-t>40?(Global.setTimeout(function()
      {
       $this.tick();
      },0),loop=false):void 0;
     }
  }
 },Obj,Scheduler);
 Scheduler.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.idle=true;
  this.robin=[];
 },Scheduler);
 Condition.ToString=function(fieldName,condition)
 {
  return condition.$==1?"{"+fieldName+":{$ne:"+JSON.stringify(condition.$0)+"}}":condition.$==2?"{"+fieldName+":{$gt:"+JSON.stringify(condition.$0)+"}}":condition.$==3?"{"+fieldName+":{$lt:"+JSON.stringify(condition.$0)+"}}":condition.$==4?"{$and:["+Condition.ToString(fieldName,condition.$0)+","+Condition.ToString(fieldName,condition.$1)+"]}":condition.$==5?"{$or:["+Condition.ToString(fieldName,condition.$0)+","+Condition.ToString(fieldName,condition.$1)+"]}":"{"+fieldName+":"+JSON.stringify(condition.$0)+"}";
 };
 Seq.nth=function(index,s)
 {
  var pos,e;
  if(index<0)
   Operators.FailWith("negative index requested");
  pos=-1;
  e=Enumerator.Get(s);
  try
  {
   while(pos<index)
    {
     !e.MoveNext()?Seq.insufficient():void 0;
     pos=pos+1;
    }
   return e.Current();
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.tryFindIndex=function(ok,s)
 {
  var e,loop,i;
  e=Enumerator.Get(s);
  try
  {
   loop=true;
   i=0;
   while(loop&&e.MoveNext())
    if(ok(e.Current()))
     loop=false;
    else
     i=i+1;
   return loop?null:{
    $:1,
    $0:i
   };
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 CancellationTokenSource=WebSharper.CancellationTokenSource=Runtime.Class({},Obj,CancellationTokenSource);
 CancellationTokenSource.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.c=false;
  this.pending=null;
  this.r=[];
  this.init=1;
 },CancellationTokenSource);
 Util.observer=function(h)
 {
  return{
   OnCompleted:function()
   {
    return null;
   },
   OnError:function()
   {
    return null;
   },
   OnNext:h
  };
 };
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 OperationCanceledException=WebSharper.OperationCanceledException=Runtime.Class({},Error,OperationCanceledException);
 OperationCanceledException.New=Runtime.Ctor(function(ct)
 {
  OperationCanceledException.New$1.call(this,"The operation was canceled.",null,ct);
 },OperationCanceledException);
 OperationCanceledException.New$1=Runtime.Ctor(function(message,inner,ct)
 {
  this.message=message;
  this.inner=inner;
  Object.setPrototypeOf(this,OperationCanceledException.prototype);
  this.ct=ct;
 },OperationCanceledException);
 InvalidOperationException=WebSharper.InvalidOperationException=Runtime.Class({},Error,InvalidOperationException);
 InvalidOperationException.New=Runtime.Ctor(function(message)
 {
  InvalidOperationException.New$2.call(this,message,null);
 },InvalidOperationException);
 InvalidOperationException.New$2=Runtime.Ctor(function(message,innerExn)
 {
  this.message=message;
  this.inner=innerExn;
  Object.setPrototypeOf(this,InvalidOperationException.prototype);
 },InvalidOperationException);
 Event$1=Event.Event=Runtime.Class({
  Trigger:function(x)
  {
   var a,i,$1;
   a=this.Handlers.slice();
   for(i=0,$1=a.length-1;i<=$1;i++)(Arrays.get(a,i))(null,x);
  },
  Subscribe$1:function(observer)
  {
   var $this;
   function h(a,x)
   {
    return observer.OnNext(x);
   }
   function dispose()
   {
    $this.RemoveHandler$1(h);
   }
   $this=this;
   this.AddHandler$1(h);
   return{
    Dispose:function()
    {
     return dispose();
    }
   };
  },
  AddHandler$1:function(h)
  {
   this.Handlers.push(h);
  },
  RemoveHandler$1:function(h)
  {
   var o,o$1;
   o=Seq.tryFindIndex(function(y)
   {
    return Unchecked.Equals(h,y);
   },this.Handlers);
   o==null?void 0:(o$1=this.Handlers,o$1.splice.apply(o$1,[o.$0,1]));
  },
  Dispose:Global.ignore,
  Subscribe:function(observer)
  {
   return this.Subscribe$1(observer);
  }
 },null,Event$1);
 Event$1.New=function(Handlers)
 {
  return new Event$1({
   Handlers:Handlers
  });
 };
 List$1=Collections.List=Runtime.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  }
 },null,List$1);
 Seq.insufficient=function()
 {
  return Operators.FailWith("The input sequence has an insufficient number of elements.");
 };
 Runtime.OnLoad(function()
 {
  Client.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
