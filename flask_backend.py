from flask import Flask, render_template, jsonify, request, redirect
from creds import regions, all_regions
import requests
from random import randint, choice, sample, random
from json import load, dump
from sys import gettrace
from cheroot.wsgi import Server as WSGIServer

dev = bool(gettrace())

app = Flask(__name__, static_url_path='')


@app.route('/')
def start():
    return redirect('/index.html')


@app.route('/index.html')
def index():
    return render_template('index.html')


@app.route('/index-a.html')
def index_a():
    return render_template('index-a.html')


@app.route('/index-g.html')
def index_g():
    return render_template('index-g.html')


@app.route('/index-u.html')
def index_u():
    return render_template('index-u.html')


@app.route('/feedback.html')
def feedback():
    return render_template('feedback.html')


@app.route('/answer.html')
def answer():
    return render_template('answer.html')


@app.route('/regions', methods=['POST'])
def get_regions():
    return jsonify(all_regions)


@app.route('/leaderboards', methods=['POST'])
def get_leaderboards():
    wages = load(open('resources/wages.json', 'r', encoding='utf-8'))
    wages = [wages[wage] for wage in wages]
    meters = load(open('resources/meters.json', 'r', encoding='utf-8'))
    meters = [meters[meter] for meter in meters]
    return jsonify(wages=wages[0:10], meters=meters[0:10])


@app.route('/get_average', methods=['POST'])
def get_average():
    reg = request.form.get('region', None)
    wages = load(open('resources/wages.json', 'r', encoding='utf-8'))
    meters = load(open('resources/meters.json', 'r', encoding='utf-8'))
    if reg:
        wage = wages[str(reg)]
        meter = meters[str(reg)]
        return jsonify(wages=[wage], meters=[meter])
    wages = [wages[wage] for wage in wages]
    meters = [meters[meter] for meter in meters]
    return jsonify(wages=wages, meters=meters)


@app.route('/generate', methods=['POST'])
def gen():
    # try:
        reg = request.form.get('region', choice(regions)['id'])
        data = {
            'region': reg
        }
        res = requests.get(f'https://declarator.org/api/v1/search/sections/', params=data).json()
        cnt = res['count']
        if cnt == 0:
            return jsonify(error='Для выбранного региона нет деклараций :c', details=str(reg))
        hints = []
        while len(hints) < 2:
            data['page'] = randint(1, cnt // 100) if cnt > 100 else 1
            res = requests.get(f'https://declarator.org/api/v1/search/sections/', params=data).json()
            off = choice(res['results'])
            office = off['main']['office']['name'] if off['main']['office']['name'] else off['main']['office']['type']['name']
            inc = {'relatives': [], 'self': []}
            est = {'relatives': [], 'self': []}
            veh = {'relatives': [], 'self': []}
            pid = str(off['main']['person']['id'])
            pr = ([], [])
            for i in off['incomes']:
                i['hint_type'] = 'income'
                if i['relative']:
                    inc['relatives'].append(i)
                    pr[1].append(i)
                else:
                    inc['self'].append(i)
            if not inc['self']:
                return jsonify(error='У чиновника не задекларирован доход :c')
            for i in off['real_estates']:
                i['hint_type'] = 'estate'
                i['duplicate'] = False
                if not i['name']:
                    i['name'] = i['type']['name']
                if i['relative']:
                    if any(i['square'] == ent['square'] and not ent['relative'] for ent in off['real_estates']):
                        i['duplicate'] = True
                    else:
                        pr[1].append(i)
                    est['relatives'].append(i)
                else:
                    pr[0].append(i)
                    est['self'].append(i)
            for i in off['vehicles']:
                i['hint_type'] = 'vehicle'
                if i['brand']:
                    brand = requests.get('https://declarator.org/api/carbrand/', params={'id': i['brand']['id']}).json()['results'][0]
                    if brand['parent_name']:
                        name = f'{brand["parent_name"]} {brand["name"]}'
                        i['name'] = name
                if not i['name'] and i['brand']:
                    i['name'] = i['brand']['name']
                if i['relative']:
                    pr[1].append(i)
                    veh['relatives'].append(i)
                else:
                    pr[0].append(i)
                    veh['self'].append(i)
            if len(pr[0]) > 2:
                hints = sample(pr[0], 3)
            else:
                hints = pr[0] + sample(pr[1], 3-len(pr[0]) if len(pr[1]) >= 3-len(pr[0]) else len(pr[1]))
        regs = load(open('resources/regs.json', 'r'))
        sal = (inc['self'][0]['size']+sum(ent['size'] for ent in inc['relatives']))/12 if inc['relatives'] else inc['self'][0]['size']/12
        offmeters = (((sal - 5308)/2)/regs[str(reg)]['coef'])/regs[str(reg)]['cost']
        realmeters = sum(ent['square'] for ent in est['self'] if ent['type']['name'] == 'Квартира' or ent['name'] == 'Квартира')
        rating = load(open('resources/rating.json', 'r', encoding='utf-8'))
        if str(pid) not in rating.keys():
            rating = -1
        else:
            rating = rating[str(pid)]
            rating = rating['+']/(rating['+']+rating['-'])
        ret = {
            'name': off['main']['person']['name'],
            'office': office,
            'info': {
                'incomes': inc,
                'estate': est,
                'vehicles': veh
            },
            'hints': {
                'count': len(hints),
                'hints': hints
            },
            'year': off['main']['year'],
            'comments': load(open('resources/comments.json', 'r')).get(pid, None),
            'rating': rating,
            'mock_rating': random(),
            'dmeters': regs[str(reg)]['docmeters'],
            'tmeters': regs[str(reg)]['termeters'],
            'smeters': regs[str(reg)]['scimeters'],
            'ometers': offmeters,
            'dwage': regs[str(reg)]['dwage'],
            'swage': regs[str(reg)]['swage'],
            'twage': regs[str(reg)]['twage'],
            'owage': inc['self'][0]['size']/12,
            'realometers': realmeters,
            'pid': pid,
            'region': {
                'name': regs[str(reg)]['name'],
                'id': reg
            }
        }
        return jsonify(ret)
    # except Exception as e:
    #     return jsonify(error=str(e))


@app.route('/addcomment', methods=['POST'])
def addcomment():
    comment = request.form.get('comment', None)
    pid = request.form.get('pid', None)
    if not comment:
        return jsonify(error='Нет комментария :c')
    if not pid:
        return jsonify(error='Нет ID чиновника :c')
    comments = load(open('resources/comments.json', 'r', encoding='utf-8'))
    if str(pid) in comments.keys():
        comments[str(pid)].append(comment)
    else:
        comments[str(pid)] = [comment]
    dump(comments, open('resources/comments.json', 'w+', encoding='utf-8'))
    return jsonify(success=True)


@app.route('/leaverating', methods=['POST'])
def rate():
    rating = request.form.get('rating', None)
    pid = request.form.get('pid', None)
    if not rating or rating not in ('+', '-'):
        return jsonify(error='Нет рейтинга :c')
    if not pid:
        return jsonify(error='Нет ID чиновника :c')
    ratings = load(open('resources/rating.json', 'r', encoding='utf-8'))
    if str(pid) in ratings.keys():
        ratings[str(pid)][rating] += 1
    else:
        ratings[str(pid)] = {
            '+': 0,
            '-': 0
        }
        ratings[str(pid)][rating] += 1
    dump(ratings, open('resources/rating.json', 'w+', encoding='utf-8'))
    return jsonify(success=True)


if dev:
    app.run(host='0.0.0.0', port=5000, debug=True)
else:
    server = WSGIServer(bind_addr=('0.0.0.0', 8020), wsgi_app=app, numthreads=1)
    print('WSGI Server Starting')
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()
