if(zena.util.version.version == "4.3.1.61"){
    Ext.cmd.derive('zena.view.ops.process.ProcessFormViewController', Ext.app.ViewController, {
        criticalPathVisible: !1,
        lastStatusClass: 'graybox',
        currNodeId: 0,
        inRefreshMode: !1,
        currentChartRecId: -1,
        panelIsActive: !0,
        noAutoRefresh: !1,
        currentForm: null,
        currentFormId: -1,
        currentFormAlias: '',
        currentItemTypeId: null,
        listViewMode: !1,
        selectedIds: [],
        bcStore: null,
        gridMenu: null,
        canView: !0,
        processStatus: 1,
        formDirty: !1,
        isForecast: !1,
        summaryRequest1: '/processes/',
        summaryRequest2: '/summary/',
        chartRequest1: '/processes/',
        chartRequest2: '/chart/',
        itemsRequest1: '/processes/',
        itemsRequest2: '/items/',
        currItemValue: null,
        currItemRec: null,
        actionsMenu: 'items',
        statusReloadInProgress: undefined,
        destroy: function() {
            if (this.gridMenu) {
                this.gridMenu.destroy()
            }
            Ext.app.ViewController.prototype.destroy.apply(this, arguments)
        },
        onFormAfterRender: function(q, r) {
            var g = this;
            var b = this.lookupReference('processPanel');
            var c = this.getView();
            var f = {};
            this.isForecast = this.getViewModel().get('isForecast');
            if (this.isForecast) {
                f['listDate'] = this.getViewModel().get('listDate');
                this.summaryRequest1 = '/schedule/forecast/summary/';
                this.summaryRequest2 = '';
                this.chartRequest1 = '/schedule/forecast/chart/';
                this.chartRequest2 = '';
                this.itemsRequest1 = '/schedule/forecast/items/';
                this.itemsRequest2 = '';
                var p = this.lookupReference('btnlogs');
                var n = this.lookupReference('btnoutput');
                var l = this.lookupReference('btncomment');
                p.setHidden(!0);
                n.setHidden(!0);
                l.setHidden(!0)
            }
            var e = this.lookupReference('frmtoolbar');
            if (e && this.isForecast) {
                e.setHidden(!0)
            }
            var o = this.lookupReference('itemsGrid');
            var d = this.lookupReference('chartPanel');
            var j = this.lookupReference('itemssearch');
            var h = this.lookupReference('itemspagingtoolbar');
            var k = this.lookupReference('outputPanel');
            k.processId = c.processId;
            var a = this.lookupReference('logsPanel');
            var m = a.lookupReference('logssearch');
            a.itemsStore = Ext.create('zena.store.ProcessLogs', {
                autoLoad: !1
            });
            a.processId = c.processId;
            a.bindStore(a.itemsStore);
            var i = a.down('zenagridtoolbar');
            i.bindStore(a.itemsStore);
            a.store = a.itemsStore;
            m.store = a.itemsStore;
            d.on('rightClickChart', this.rightClickChart, this);
            d.on('clickChart', this.clickChart, this);
            b.itemsStore = Ext.create('zena.store.ProcessItems', {
                autoLoad: !1
            });
            b.itemsStore.getProxy().url = zena.baseURL + zena.serverName + this.itemsRequest1 + c.processId + this.itemsRequest2;
            if (g.isForecast) {
                b.itemsStore.getProxy().extraParams.listDate = g.getViewModel().get('listDate')
            }
            b.itemsStore.on('load', this.onItemsStoreLoad, this);
            o.bindStore(b.itemsStore);
            j.store = b.itemsStore;
            h.bindStore(b.itemsStore);
            b.itemRefreshTask = {
                run: this.requestUpdatedItems,
                interval: 5000,
                scope: this
            };
            this.createGridMenu();
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + this.summaryRequest1 + c.processId + this.summaryRequest2,
                params: f,
                success: function(f, g) {
                    var b = Ext.decode(f.responseText);
                    if (b.success == undefined || b.success) {
                        this.bcLogsStore = Ext.create('Ext.data.TreeStore', b);
                        var e = a.lookupReference('logsbreadcrumb');
                        e.setStore(this.bcLogsStore);
                        var c = this.lookupReference('breadcrumb');
                        var d = this.lookupReference('itemsbreadcrumb');
                        this.bcStore = Ext.create('zena.store.ProcessProcessItems', b);
                        c.setStore(this.bcStore);
                        d.setStore(this.bcStore)
                    } else {
                        Ext.helper.msg('Failed', b.message)
                    }
                },
                scope: this,
                failure: function(a, b) {
                    console.log('server-side failure with status code ' + a.status)
                }
            })
        },
        findPos: function(a) {
            var b = curtop = 0;
            if (a.offsetParent) {
                do {
                    b += a.offsetLeft;
                    curtop += a.offsetTop
                } while (a = a.offsetParent);
                return [b, curtop]
            }
        },
        getSelectedItems: function() {
            var a = [];
            a.length = 0;
            var d = this.getView();
            var b = this.lookupReference('itemsGrid');
            if (b.getSelectionModel().hasSelection()) {
                var c = b.getSelectionModel().getSelection();
                c.forEach(function(b) {
                    a.push({
                        id: b.get('id'),
                        alias: b.get('alias'),
                        itemType: b.get('itemTypeId'),
                        canViewDef: b.get('canViewDef'),
                        status: b.get('statusId'),
                        uid: b.get('uid')
                    })
                });
                this.selectedIds = a
            }
        },
        rightClickChart: function(b, c, d) {
            var a = [];
            a.length = 0;
            if (b) {
                b.forEach(function(e) {
                    a.push({
                        id: e.id,
                        alias: e.alias,
                        itemType: e.itemTypeId,
                        canViewDef: e.canViewDef,
                        status: e.statusId
                    })
                });
                this.selectedIds = a
            } else {
                this.selectedIds = null
            }
            this.showGridMenu(c, d)
        },
        clickChart: function(a) {
            if (!a) {
                return
            }
            if (a.itemTypeId == 1) {
                this.setBCNode(a.id)
            } else {
                this.displayItemForm(a.id, a.alias, a.itemTypeId)
            }
        },
        onItemsBCSelectionChange: function(c, a, b) {
            if (a != null) {
                this.requestProcessItems(a.id)
            }
        },
        requestProcessItems: function(b) {
            var c = this.lookupReference('itemsGrid');
            var a = this.lookupReference('processPanel');
            a.itemsStore.getProxy().extraParams.node = b;
            this.currNodeId = b;
            a.itemsStore.load()
        },
        onBCSelectionChange: function(c, a, b) {
            if (a != null) {
                this.requestChartDetails(a.id)
            }
        },
        setBCNode: function(b) {
            var c = this.lookupReference('breadcrumb');
            var a = null;
            if (b == 0) {
                a = this.bcStore.getRoot()
            } else {
                a = this.bcStore.getNodeById(b)
            }
            if (a) {
                c.setSelection(a)
            }
        },
        setItemsBCNode: function(b) {
            var c = this.lookupReference('itemsbreadcrumb');
            var a = null;
            if (b == 0) {
                a = this.bcStore.getRoot()
            } else {
                a = this.bcStore.getNodeById(b)
            }
            if (a) {
                c.setSelection(a)
            }
        },
        requestOutput: function(c) {
            var a = this.lookupReference('outputPanel');
            a.getController().setCurrentItem(c);
            var b = this.lookupReference('btnoutput');
            b.toggle(!0, !1)
        },
        displayDependencyProcess: function(b, a) {
            this.fireEvent('displayprocessaction', b, a)
        },
        displayDependencyTask: function(a, b) {
            this.fireEvent('displaytaskaction', a)
        },
        onCriticalPathClick: function(e, a, d) {
            var c = this;
            var f = this.getView();
            this.criticalPathVisible = a;
            if (a) {
                this.showCriticalPath()
            } else {
                var b = c.lookupReference('chartPanel');
                b.clearCriticalPath()
            }
        },
        showCriticalPath: function() {
            var b = this;
            var a = this.getView();
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + a.processId + '/criticalPath',
                params: {
                    node: this.currentChartRecId
                },
                success: function(d, e) {
                    var a = Ext.decode(d.responseText);
                    if (a.success) {
                        var c = b.lookupReference('chartPanel');
                        c.displayCriticalPath(a.links)
                    }
                },
                scope: this,
                failure: function(a, b) {
                    console.log('server-side failure with status code ' + a.status)
                }
            })
        },
        requestDependencyProcess: function(b) {
            var a = this;
            var c = this.getView();
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + c.processId + '/items/' + b + '/lookup',
                params: {
                    type: 'dependency'
                },
                success: function(f, g) {
                    var c = Ext.decode(f.responseText);
                    if (c.success) {
                        if (c.items.length > 1) {
                            var d = Ext.create('zena.store.RunProcesses', {
                                autoLoad: !1
                            });
                            d.loadData(c.items);
                            var e = Ext.widget('selectrunprocessform', {
                                floating: !0,
                                title: _t('RelatedProcesses', 'Related Processes'),
                                viewModel: {
                                    stores: {
                                        grid: d
                                    }
                                },
                                listeners: {
                                    itemSelected: function(d, c) {
                                        a.displayDependencyProcess(d, c)
                                    }
                                }
                            });
                            e.show()
                        } else if (c.items.length == 1) {
                            a.displayDependencyProcess(c.items[0].id, c.items[0].name)
                        } else {
                            Ext.helper.msg('Message', 'No Items')
                        }
                    } else {
                        Ext.helper.msg('Message', c.message)
                    }
                },
                scope: this,
                failure: function(a, c) {
                    console.log('server-side failure with status code ' + a.status)
                }
            })
        },
        requestDependencyTask: function(a) {
            var c = this;
            var b = this.getView();
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + b.processId + '/items/' + a + '/lookup',
                params: {
                    type: 'taskDependency'
                },
                success: function(f, g) {
                    var b = Ext.decode(f.responseText);
                    if (b.success) {
                        if (b.items.length > 0) {
                            var d = Ext.create('zena.store.Tasks', {
                                autoLoad: !1
                            });
                            d.loadData(b.items);
                            var e = Ext.widget('selectrunprocessform', {
                                isTaskRunProcess: !0,
                                floating: !0,
                                title: _t('RelatedTasks', 'Related Tasks'),
                                viewModel: {
                                    stores: {
                                        grid: d
                                    }
                                },
                                listeners: {
                                    itemSelected: function(d, b) {
                                        c.displayDependencyTask(d, b)
                                    }
                                }
                            });
                            e.show()
                        } else {
                            Ext.helper.msg('Message', 'No Items')
                        }
                    } else {
                        Ext.helper.msg('Message', b.message)
                    }
                },
                scope: this,
                failure: function(b, c) {
                    console.log('server-side failure with status code ' + b.status)
                }
            })
        },
        requestNotes: function(a) {
            var c = this;
            var b = this.getView();
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + b.processId + '/items/' + a + '/notes',
                success: function(d, f) {
                    var c = Ext.decode(d.responseText);
                    if (c.success) {
                        if (c.isUrl) {
                            var b = c.notes;
                            if (b.toLowerCase().indexOf('http') != 0) {
                                if (b.toLowerCase().indexOf('file') != 0) {
                                    console.log('adding http', b);
                                    b = 'http://' + b
                                }
                            }
                            try {
                                window.open(b, 'Notes')
                            } catch (g) {
                                alert(g.message)
                            }
                        } else {
                            var e = Ext.create('widget.extendededitform', {
                                width: 500,
                                height: 250,
                                readOnly: !0,
                                cls: 'noborder',
                                title: _t('Notes', 'Notes'),
                                isHTMLEditor: zena.app.rtfEnabled,
                                viewModel: {
                                    data: {
                                        textvalue: c.notes,
                                        hasOkay: !1,
                                        closeLabel: _b('Close', 'Close')
                                    }
                                }
                            });
                            e.show()
                        }
                    } else {
                        if (c.message) {
                            Ext.helper.msg('Message', c.message)
                        } else {
                            Ext.helper.msg('Message', 'Item does not contain notes')
                        }
                    }
                },
                scope: this,
                failure: function(b, c) {
                    console.log('server-side failure with status code ' + b.status)
                }
            })
        },
        requestLogs: function(c) {
            var a = this.lookupReference('logsPanel');
            a.getController().setBCNode(c);
            var b = this.lookupReference('btnlogs');
            b.toggle(!0, !1)
        },
        processItemView: function(b, e, f, d) {
            var c = this.getView();
            var a = this.selectedIds[0];
            switch (b.action) {
                case 'output':
                    this.requestOutput(a.id);
                    break;
                case 'logs':
                    this.requestLogs(a.id);
                    break;
                case 'process':
                    this.requestDependencyProcess(a.id);
                    break;
                case 'task':
                    this.requestDependencyTask(a.id);
                    break;
                case 'notes':
                    this.requestNotes(a.id);
                    break;
                case 'comments':
                    this.onCommentBtnClick();
                    break;
                case 'criticalpath':
                    this.onCriticalPathClick();
                    break;
                default:
                    Ext.Ajax.request({
                        disableCaching: !0,
                        method: 'GET',
                        url: zena.baseURL + zena.serverName + '/processes/' + c.processId + '/items/' + a.id + '/' + b.action,
                        params: {
                            id: c.processId,
                            itemUid: a.uid,
                            itemId: a.id
                        },
                        success: function(a, c) {
                            Ext.Msg.alert('Response', a.responseText)
                        },
                        scope: this,
                        failure: function(a, c) {
                            console.log('server-side failure with status code ' + a.status)
                        }
                    });
                    break;
            }
        },
        addDep: function(c, g, k, l, f, e, b, i, h, j) {
            var d = this;
            var a = {
                operation: 'adddep',
                id: c,
                itemId: g,
                depAlias: k,
                depRunId: f,
                depProcess: e,
                depStatus: j,
                depIsItemDep: b
            };
            if (b) {
                a.depItemUid = i;
                a.depItem = h
            }
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + c + '/items/adddep',
                params: a,
                success: function(m, o) {
                    var n = Ext.decode(m.responseText);
                    d.requestUpdatedItems();
                    var a = d.lookupReference('processPanel');
                    a.itemsStore.load();
                    Ext.helper.msg('Success', n.message)
                },
                scope: this,
                failure: function(a, d) {
                    console.log('server-side failure with status code ' + a.status)
                }
            })
        },
        addDynamicDep: function(f, e, g, d) {
            var a = this;
            var b = this.selectedIds[0];
            var c = Ext.widget('adddynamicdepform', {
                floating: !0,
                viewModel: {
                    data: {
                        sourceId: this.getView().processId,
                        sourceItemId: b.id
                    }
                },
                listeners: {
                    addDep: a.addDep,
                    scope: a
                }
            });
            c.show()
        },
        processItemAction: function(b, h, i, g) {
            var d = this.getView();
            var f = this.selectedIds[0];
            var c = [];
            this.selectedIds.forEach(function(a) {
                c.push(a.id)
            });
            var a = c.join();
            var e = {
                id: a,
                action: b.action
            };
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'PUT',
                url: zena.baseURL + zena.serverName + '/processes/' + d.processId + '/items/' + b.action,
                jsonData: Ext.encode(e),
                params: {
                    id: d.processId,
                    itemId: a
                },
                success: function(c, d) {
                    Ext.helper.msg('Action Requested for item(s) ' + a, b.action)
                },
                scope: this,
                failure: function(a, c) {
                    console.log('server-side failure with status code ' + a.status)
                }
            })
        },
        processViewAlerts: function(e, d, f, c) {
            var a = this.selectedIds[0];
            var b = this.getView();
            zena.getApplication().fireEvent('displayprocessalerts', b.processId, a.alias)
        },
        createGridMenu: function() {
            this.gridMenu = new Ext.menu.Menu({
                listeners: {
                    render: {
                        fn: function(a) {
                            var b = a.getEl();
                            this.el.on('contextmenu', function() {}, this, {
                                capture: !0,
                                stopPropagation: !0,
                                preventDefault: !0
                            })
                        }
                    }
                },
                items: [{
                    text: _m('Properties', 'Properties'),
                    action: 'properties',
                    scope: this,
                    handler: function() {
                        record = this.selectedIds[0];
                        this.displayItemForm(record.id, record.alias, record.itemTypeId)
                    }
                }, {
                    hidden: this.isForecast,
                    xtype: 'menuseparator'
                }, {
                    text: _m('Operations', 'Operations'),
                    action: 'actions',
                    hidden: this.isForecast,
                    menu: {
                        items: [{
                            text: _m('Hold', 'Hold'),
                            scope: this,
                            action: 'hold',
                            handler: this.processItemAction
                        }, {
                            text: _m('Release', 'Release'),
                            scope: this,
                            action: 'release',
                            handler: this.processItemAction
                        }, {
                            text: _m('Cancel', 'Cancel'),
                            scope: this,
                            action: 'cancel',
                            handler: this.processItemAction
                        }, {
                            text: _m('Rerun', 'Rerun'),
                            scope: this,
                            action: 'rerun',
                            handler: this.processItemAction
                        }, {
                            text: _m('RerunIncludeDeps', 'Rerun (include dependents)'),
                            scope: this,
                            action: 'rerunincdeps',
                            handler: this.processItemAction
                        }, {
                            text: _m('OverrideResources', 'Override Resources'),
                            scope: this,
                            action: 'overrideresources',
                            handler: this.processItemAction
                        }, {
                            text: _m('ReleaseDependents', 'Release Dependents'),
                            scope: this,
                            action: 'releasedeps',
                            handler: this.processItemAction
                        }, {
                            text: _m('SetToNormal', 'Set to Normal'),
                            scope: this,
                            action: 'setnormal',
                            handler: this.processItemAction
                        }, {
                            text: _m('SetToAbnormal', 'Set to Abnormal'),
                            scope: this,
                            action: 'setabnormal',
                            handler: this.processItemAction
                        }, {
                            text: _m('SetToErred', 'Set to Erred'),
                            scope: this,
                            action: 'seterred',
                            handler: this.processItemAction
                        }, {
                            text: _m('SetToCancelled', 'Set to Cancelled'),
                            scope: this,
                            action: 'setcancel',
                            handler: this.processItemAction
                        }, {
                            text: _m('Skip', 'Skip'),
                            scope: this,
                            action: 'skip',
                            handler: this.processItemAction
                        }, {
                            text: _m('Unskip', 'Un-skip'),
                            scope: this,
                            action: 'unskip',
                            handler: this.processItemAction
                        }, '-', {
                            text: _m('AddDynamicDep', 'Add Dynamic Dependency'),
                            scope: this,
                            action: 'adddep',
                            handler: this.addDynamicDep
                        }]
                    }
                }, {
                    hidden: this.isForecast,
                    xtype: 'menuseparator'
                }, {
                    text: _m('View', 'View'),
                    action: 'view',
                    menu: {
                        items: [{
                            text: _m('RelatedProcess', 'Related Processes'),
                            scope: this,
                            action: 'process',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, {
                            text: _m('TaskDependencies', 'Task Dependencies'),
                            scope: this,
                            action: 'task',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, {
                            text: _m('Diagram', 'Diagram'),
                            scope: this,
                            action: 'viewdiagram',
                            handler: function() {
                                this.requestAndDisplayChart()
                            }
                        }, {
                            text: _m('AutoLayout', 'Auto Layout'),
                            action: 'layout',
                            scope: this,
                            menu: {
                                items: [{
                                    text: _m('Directed', 'Directed'),
                                    scope: this,
                                    action: 'directed',
                                    handler: function(b) {
                                        var a = this.lookupReference('chartPanel');
                                        a.autoLayoutDiagram(b.action)
                                    }
                                }, {
                                    text: _m('HorizontalTree', 'Horizontal Tree'),
                                    scope: this,
                                    action: 'tree_horizontal',
                                    handler: function(b) {
                                        var a = this.lookupReference('chartPanel');
                                        a.autoLayoutDiagram(b.action)
                                    }
                                }, {
                                    text: _m('VerticalTree', 'Vertical Tree'),
                                    scope: this,
                                    action: 'tree_vertical',
                                    handler: function(b) {
                                        var a = this.lookupReference('chartPanel');
                                        a.autoLayoutDiagram(b.action)
                                    }
                                }, {
                                    text: _m('LayeredDigraph', 'Layered Digraph'),
                                    scope: this,
                                    action: 'digraph',
                                    handler: function(b) {
                                        var a = this.lookupReference('chartPanel');
                                        a.autoLayoutDiagram(b.action)
                                    }
                                }]
                            }
                        }, {
                            text: _m('Logs', 'Logs'),
                            scope: this,
                            action: 'logs',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, {
                            text: _m('Output', 'Output'),
                            scope: this,
                            action: 'output',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, {
                            text: _m('Notes', 'Notes'),
                            scope: this,
                            action: 'notes',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, {
                            text: _m('Comments', 'Comments'),
                            scope: this,
                            action: 'comments',
                            hidden: this.isForecast,
                            handler: this.processItemView
                        }, '-', {
                            text: _m('CriticalPath', 'Critical Path'),
                            xtype: 'menucheckitem',
                            scope: this,
                            action: 'criticalpath',
                            hidden: this.isForecast,
                            checkHandler: this.onCriticalPathClick
                        }, {
                            xtype: 'menuseparator',
                            action: 'cpathsep'
                        }, {
                            text: _m('History', 'History...'),
                            scope: this,
                            action: 'processhistory',
                            handler: this.processViewHistory
                        }, {
                            text: _m('ProcessAlerts', 'Alerts...'),
                            scope: this,
                            action: 'viewalerts',
                            handler: this.processViewAlerts
                        }]
                    }
                }, {
                    xtype: 'menuseparator',
                    action: 'printsep'
                }, {
                    text: _m('PrintDiagram', 'Print Diagram'),
                    action: 'printchart',
                    scope: this,
                    handler: function(b) {
                        var a = this.lookupReference('chartPanel');
                        a.printChart()
                    }
                }]
            })
        },
        onItemsStoreLoad: function(b, e, c, d, f) {
            if (b.proxy.reader.rawData.timeUpdated) {
                b.timeUpdated = b.proxy.reader.rawData.timeUpdated
            }
            var a = b.getById(0);
            if (a) {
                this.updateMainStatus(a.data.colorId, a.data.statusId, a.data.status);
                this.processDefId = a.get('defId');
                this.processName = a.get('name')
            }
        },
        onTogglePanel: function(a, f) {
            var d = this.lookupReference('chartPanel');
            var g = d.getEl().dom.getBoundingClientRect();
            if (f) {
                var b = this.lookupReference('processPanel');
                var h = this.getView();
                if (a.reference === 'btnchart') {
                    if (this.currentChartRecId == -1) {
                        this.requestAndDisplayChart()
                    }
                    this.actionsMenu = 'chart'
                } else if (a.reference === 'btnlogs') {
                    var e = this.lookupReference('logsPanel');
                    e.getController().displayPanel();
                    this.actionsMenu = 'logs'
                } else if (a.reference === 'btnitems') {
                    if (!b.itemsStore) {}
                    this.actionsMenu = 'items'
                } else if (a.reference === 'btnoutput') {
                    var c = this.lookupReference('outputPanel');
                    c.getController().displayPanel();
                    this.actionsMenu = 'output'
                }
                b.getLayout().setActiveItem(a.itemIndex)
            }
        },
        updateMainStatus: function(e, c, d) {
            if (!this.inRefreshMode) {
                this.setAutoRefresh(!0);
                this.inRefreshMode = !0
            }
            this.processStatus = c;
            var b = zena.util.Defs.getStatusTextCls(e);
            if (this.lastStatusClass !== b) {
                var a = this.lookupReference('iconstatus');
                a.removeCls(this.lastStatusClass);
                a.addCls(b);
                this.lastStatusClass = b;
                a.setHtml(d)
            }
        },
        refreshProcessList: function(f, h) {
            this.statusReloadInProgress = !1;
            var b = this.lookupReference('processPanel');
            if (!b) {
                return
            }
            var a = this.lookupReference('chartPanel');
            var i = this.getView();
            var d = Ext.decode(f.responseText);
            b.timeUpdated = d.timeUpdated;
            var g = this.lookupReference('itemsTree');
            var e = this;
            var c = this.currentChartRecId;
            b.itemsStore.beginUpdate();
            if (a.diagram) {
                a.diagram.startTransaction()
            }
            Ext.each(d.items, function(d) {
                if (d.parentId === 0 && c == 0) {
                    if (a.updateItem && d.id != 0) {
                        a.updateItem(d)
                    }
                } else if (c >= 0 && d.parentId == c) {
                    if (a.updateItem) {
                        a.updateItem(d)
                    }
                }
                var g = b.itemsStore.getById(d.id);
                if (g) {
                    if (g.id === 0) {
                        e.updateMainStatus(d.colorId, d.statusId, d.status)
                    }
                    g.set(d);
                    g.set('iconCls');
                    g.commit()
                }
            });
            if (a.diagram) {
                a.diagram.commitTransaction()
            }
            b.itemsStore.endUpdate()
        },
        ORG_refreshProcessList: function(f, h) {
            var a = this.lookupReference('processPanel');
            var b = this.lookupReference('chartPanel');
            var i = this.getView();
            var d = Ext.decode(f.responseText);
            a.timeUpdated = d.timeUpdated;
            var g = this.lookupReference('itemsTree');
            var e = this;
            var c = this.currentChartRecId;
            a.itemsStore.beginUpdate();
            Ext.each(d.items, function(d) {
                if (d.parentId === 0 && c == 0) {
                    if (b.updateItem) {
                        b.updateItem(d)
                    }
                } else if (c >= 0 && d.parentId == c) {
                    if (b.updateItem) {
                        b.updateItem(d)
                    }
                }
                var g = a.itemsStore.getById(d.id);
                if (g) {
                    if (g.id === 0) {
                        e.updateMainStatus(d.colorId, d.statusId, d.status)
                    }
                    g.set(d);
                    g.set('iconCls');
                    g.commit()
                }
            });
            a.itemsStore.endUpdate()
        },
        requestUpdatedItems: function() {
            if (this.statusReloadInProgress) {
                return
            }
            var a = this;
            if (!a.panelIsActive) {
                return
            }
            if (a.noAutoRefresh) {
                return
            }
            var b = this.lookupReference('processPanel');
            var c = this.getView();
            if (!b) {
                return
            }
            if (!b.timeUpdated) {
                b.timeUpdated = b.itemsStore.timeUpdated
            }
            a.statusReloadInProgress = !0;
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + '/processes/' + c.processId + '/changes',
                params: {
                    id: c.processId,
                    timeUpdated: b.timeUpdated
                },
                success: a.refreshProcessList,
                scope: a,
                failure: function(b, c) {
                    a.statusReloadInProgress = !1;
                    a.noAutoRefresh = !0;
                    console.log('server-side failure with status code ' + b.status)
                }
            })
        },
        onFormRender: function(a, b) {},
        onProcessCloseClick: function(b, d, c) {
            var a = this.getView();
            a.close()
        },
        setAutoRefresh: function(b) {
            var a = this.lookupReference('processPanel');
            if (a.itemRefreshTask && !this.isForecast) {
                if (b) {
                    Ext.TaskManager.start(a.itemRefreshTask)
                } else {
                    Ext.TaskManager.stop(a.itemRefreshTask)
                }
            }
        },
        onFormBeforeClose: function(b, a) {
            this.setAutoRefresh(!1)
        },
        onFormLogsClick: function(a, c, b) {
            this.requestLogs(this.currentFormId)
        },
        onFormNotesClick: function(a, c, b) {
            this.requestNotes(this.currentFormId)
        },
        onFormOutputClick: function(a, c, b) {
            this.requestOutput(this.currentFormId)
        },
        onFormViewBtnClick: function(b, e, d) {
            if (b.pressed) {
                var a = null;
                this.getSelectedItems();
                if (this.selectedIds.length > 0) {
                    a = this.selectedIds[0];
                    this.displayItemForm(a.id, a.alias, a.itemTypeId)
                } else {
                    var c = this.lookupReference('itemsGrid');
                    a = c.getStore().getById(this.currNodeId);
                    if (a != null) {
                        this.displayItemForm(a.get('id'), a.get('alias'), a.get('itemTypeId'))
                    }
                }
            } else {
                if (this.formDirty) {
                    Ext.helper.msg('', 'Changes to current item must first be saved or discarded');
                    b.setPressed(!0);
                    return !1
                }
                this.cancelForm()
            }
        },
        onListViewBtnClick: function(a, e, d) {
            var c = this.lookupReference('itemsGrid');
            var b = this.lookupReference('itemsbreadcrumb');
            if (a.pressed) {
                b.setDisabled(!0);
                a.setIconCls('zf icon-tree-view');
                a.setTooltip('Switch to tree view');
                this.listViewMode = !0
            } else {
                b.setDisabled(!1);
                a.setTooltip('Switch to list view');
                a.setIconCls('zf icon-list');
                this.listViewMode = !1
            }
            c.getStore().getProxy().extraParams.listView = this.listViewMode;
            c.getStore().loadPage(1)
        },
        tabLostFocus: function() {
            this.panelIsActive = !1
        },
        tabGainedFocus: function() {
            this.panelIsActive = !0
        },
        onMenuBtnClick: function(b, a, c) {
            this.showContextMenu(a)
        },
        onViewRowContextMenu: function(e, g, j, f, a, h) {
            this.showContextMenu(a);
            return;
            var b = [];
            b.length = 0;
            var i = this.getView();
            var c = this.lookupReference('itemsGrid');
            if (c.getSelectionModel().hasSelection()) {
                var d = c.getSelectionModel().getSelection();
                d.forEach(function(c) {
                    b.push({
                        id: c.get('id'),
                        alias: c.get('alias'),
                        itemType: c.get('itemTypeId'),
                        canViewDef: c.get('canViewDef'),
                        status: c.get('statusId'),
                        uid: c.get('uid')
                    })
                })
            }
            this.selectedIds = b;
            a.stopEvent();
            this.showGridMenu(a.getX(), a.getY())
        },
        showContextMenu: function(b) {
            var a = [];
            a.length = 0;
            var e = this.getView();
            var c = this.lookupReference('itemsGrid');
            if (c.getSelectionModel().hasSelection()) {
                var d = c.getSelectionModel().getSelection();
                d.forEach(function(c) {
                    a.push({
                        id: c.get('id'),
                        alias: c.get('alias'),
                        itemType: c.get('itemTypeId'),
                        canViewDef: c.get('canViewDef'),
                        status: c.get('statusId'),
                        uid: c.get('uid')
                    })
                });
                this.selectedIds = a;
                b.stopEvent()
            }
            this.showGridMenu(b.getX(), b.getY())
        },
        isItemsView: function() {
            var a = this.lookupReference('processPanel');
            var b = a.getLayout().getActiveItem();
            return b.reference == 'itemsGrid'
        },
        isChartView: function() {
            var a = this.lookupReference('processPanel');
            var b = a.getLayout().getActiveItem();
            return b.reference == 'chartPanel'
        },
        setupMenuItems: function() {
            var a = this.gridMenu.down('[action=viewdiagram]');
            var s = this.gridMenu.down('[action=actions]');
            var i = this.gridMenu.down('[action=printchart]');
            var c = this.gridMenu.down('[action=criticalpath]');
            var j = this.gridMenu.down('[action=cpathsep]');
            var e = this.gridMenu.down('[action=printsep]');
            var g = this.gridMenu.down('[action=properties]');
            var b = this.gridMenu.down('[action=layout]');
            var d = this.gridMenu.down('[action=processhistory]');
            var h = this.gridMenu.down('[action=viewalerts]');
            var k = this.gridMenu.down('[action=notes]');
            var l = this.gridMenu.down('[action=logs]');
            var f = this.gridMenu.down('[action=output]');
            var r = this.gridMenu.down('[action=process]');
            var x = this.gridMenu.down('[action=task]');
            a.enable();
            s.enable();
            g.enable();
            a.enable();
            e.enable();
            k.enable();
            l.enable();
            f.enable();
            d.enable();
            if (this.isItemsView()) {
                c.setVisible(!1);
                j.setVisible(!1)
            } else {
                c.setVisible(!0);
                j.setVisible(!0)
            }
            if (!this.selectedIds) {
                this.selectedIds = []
            }
            if (h) {
                var m = !1;
                if (this.selectedIds.length == 1) {
                    var F = this.selectedIds[0];
                    if (F.id == 0) {
                        m = !0
                    }
                }
                h.setVisible(m)
            }
            if (a) {
                var v = this.lookupReference('processPanel');
                var G = v.getLayout().getActiveItem();
                if (this.isItemsView()) {
                    a.enable();
                    i.setVisible(!1);
                    c.setVisible(!1);
                    e.setVisible(!1);
                    b.setVisible(!1)
                } else {
                    b.setVisible(!0);
                    e.setVisible(!0);
                    c.setVisible(!0);
                    i.setVisible(!0);
                    if (this.selectedIds.length == 1 && this.selectedIds[0].itemType == 1) {
                        a.enable()
                    } else {
                        a.disable()
                    }
                }
            }
            if (g) {
                if (this.selectedIds.length != 1) {
                    g.disable();
                    k.disable();
                    l.disable();
                    f.disable();
                    d.disable()
                }
            }
            if (b) {
                b.setVisible(!this.isItemsView())
            }
            if (!zena.app.layoutEnabled) {
                b.setVisible(!1)
            }
            var D = this.gridMenu.down('[action=hold]');
            var y = this.gridMenu.down('[action=release]');
            var A = this.gridMenu.down('[action=cancel]');
            var C = this.gridMenu.down('[action=rerun]');
            var o = this.gridMenu.down('[action=rerunincdeps]');
            var n = this.gridMenu.down('[action=overrideresources]');
            var p = this.gridMenu.down('[action=releasedeps]');
            var u = this.gridMenu.down('[action=setnormal]');
            var q = this.gridMenu.down('[action=setabnormal]');
            var w = this.gridMenu.down('[action=seterred]');
            var t = this.gridMenu.down('[action=setcancel]');
            var E = this.gridMenu.down('[action=skip]');
            var B = this.gridMenu.down('[action=unskip]');
            var z = this.gridMenu.down('[action=adddep]');
            r.setVisible(zena.util.Defs.canViewDependency(this.selectedIds));
            x.setVisible(zena.util.Defs.canViewTaskDependency(this.selectedIds));
            D.setDisabled(!zena.util.Defs.canBeHeld(this.selectedIds));
            y.setDisabled(!zena.util.Defs.canBeReleased(this.selectedIds));
            A.setDisabled(!zena.util.Defs.canBeCancelled(this.selectedIds));
            C.setDisabled(!zena.util.Defs.canBeRerun(this.selectedIds));
            o.setDisabled(!zena.util.Defs.canBeRerun(this.selectedIds));
            n.setDisabled(!zena.util.Defs.canBeOverride(this.selectedIds));
            p.setDisabled(!zena.util.Defs.canReleaseDeps(this.selectedIds, this.processStatus));
            u.setDisabled(!zena.util.Defs.canSetStatus(this.selectedIds, this.processStatus));
            q.setDisabled(!zena.util.Defs.canSetStatus(this.selectedIds, this.processStatus));
            w.setDisabled(!zena.util.Defs.canSetStatus(this.selectedIds, this.processStatus));
            t.setDisabled(!zena.util.Defs.canSetCancelled(this.selectedIds));
            E.setDisabled(!zena.util.Defs.canSkip(this.selectedIds));
            B.setDisabled(!zena.util.Defs.canUnSkip(this.selectedIds));
            z.setDisabled(!zena.util.Defs.canAddDep(this.selectedIds));
            d.setDisabled(!(this.selectedIds.length == 1 && [zena.util.Defs.ITEM_TYPE_PROCESS, zena.util.Defs.ITEM_TYPE_TASK, zena.util.Defs.ITEM_TYPE_SCRIPT, zena.util.Defs.ITEM_TYPE_SENDEVENT, zena.util.Defs.ITEM_TYPE_USERINPUT].indexOf(this.selectedIds[0].itemType) > -1));
            f.setDisabled(!(this.selectedIds.length == 1 && [zena.util.Defs.ITEM_TYPE_PROCESS, zena.util.Defs.ITEM_TYPE_SCRIPT, zena.util.Defs.ITEM_TYPE_TASK].indexOf(this.selectedIds[0].itemType) > -1))
        },
        onBaseFormMenuClick: function(a, d) {
            switch (this.actionsMenu) {
                case 'items':
                    this.showContextMenu(a);
                    break;
                case 'chart':
                    this.rightClickChart(null, a.getX(), a.getY());
                    break;
                case 'output':
                    var b = this.lookupReference('outputPanel');
                    b.getController().showMenu(a);
                    break;
                case 'logs':
                    var c = this.lookupReference('logsPanel');
                    c.getController().showMenu(a);
                    break;
            }
        },
        showGridMenu: function(a, b) {
            this.setupMenuItems();
            this.gridMenu.showAt(a, b)
        },
        getItemMenu: function(a) {
            return this.gridMenu
        },
        onViewRowClick: function(a, c, e, b, f, d) {},
        onViewRowDblClick: function(b, a, e, c, f, d) {
            if (this.currentForm == null && (a.get('itemTypeId') == 1 && !a.get('isChild') || a.get('itemTypeId') !== 1)) {
                this.displayItemForm(a.id, a.data.alias, a.data.itemTypeId)
            }
        },
        itemsSelectionChange: function(d, b, c) {
            if (b.length > 0) {
                var a = b[0];
                if (this.currentFormId === a.id) {
                    return
                }
                if (!this.formDirty && this.currentForm != null) {
                    this.displayItemForm(a.id, a.data.alias, a.data.itemTypeId)
                }
            }
        },
        onCellClick: function(c, f, b, a, g, d, h, e) {
            if (a.get('itemTypeId') == 1 && a.get('id') != this.currNodeId && b != 0) {
                this.setItemsBCNode(a.id)
            }
        },
        displayItemForm: function(c, b, a) {
            if (this.formDirty) {
                Ext.helper.msg('', 'Changes to current item must first be saved or discarded');
                return !1
            }
            this.requestItemDetails(c, b, a)
        },
        onFormRefresh: function(a) {
            this.requestItemDetails(this.currentFormId, this.currentFormAlias, this.currentItemTypeId, !0)
        },
        requestAndDisplayChart: function() {
            var a = 0;
            var b = '';
            if (!this.selectedIds || this.selectedIds.length == 0) {
                a = 0
            } else if (this.isItemsView()) {
                if (this.selectedIds[0].itemType == 1) {
                    a = this.selectedIds[0].id;
                    b = this.selectedIds[0].uid
                } else {
                    var d = this.lookupReference('processPanel');
                    var c = d.itemsStore.getById(this.selectedIds[0].id);
                    b = c.get('uid');
                    if (c.parentId) {
                        var f = d.itemsStore.getById(c.parentId);
                        if (f) {
                            a = f.id
                        }
                    }
                }
            } else {
                a = this.selectedIds[0].id
            }
            var g = this.lookupReference('btnchart');
            g.toggle(!0, !1);
            this.setBCNode(a);
            if (b != '') {
                var e = this.lookupReference('chartPanel');
                if (e) {
                    e.selectNode(b)
                }
            }
        },
        requestChartDetails: function(a) {
            var c = this;
            if (this.currentChartRecId == a) {
                return
            }
            var b = this.getView();
            this.currentChartRecId = a;
            params = {
                node: a,
                id: b.processId
            };
            if (c.isForecast) {
                params['listDate'] = c.getViewModel().get('listDate')
            }
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + this.chartRequest1 + b.processId + this.chartRequest2,
                params: params,
                success: this.setChartDetails,
                scope: this,
                failure: function(b, c) {
                    console.log('server-side failure with status code ' + b.status)
                }
            })
        },
        requestItemDetails: function(a, c, d, g) {
            var f = this;
            var b = this.getView();
            this.currentFormId = a;
            this.currentItemTypeId = d;
            var e = {
                itemId: a,
                id: b.processId
            };
            this.currentFormAlias = c;
            Ext.Ajax.request({
                disableCaching: !0,
                method: 'GET',
                url: zena.baseURL + zena.serverName + this.summaryRequest1 + b.processId + '/items/' + a,
                params: e,
                success: f.setFormDetails,
                scope: this,
                failure: function(b, e) {
                    console.log('server-side failure with status code ' + b.status)
                }
            })
        },
        setChartDetails: function(d, e) {
            var c = this;
            var a = Ext.decode(d.responseText);
            var b = this.lookupReference('chartPanel');
            if (b.setProcess && a.items) {
                this.zlinks = a.links;
                this.zitems = a.items;
                this.zlinks.forEach(function(a) {
                    if (a.points) {
                        a.points.splice(0, 0, 0);
                        a.points.splice(0, 0, 0);
                        a.points.push(0);
                        a.points.push(0)
                    }
                });
                b.setProcess(this.zitems, this.zlinks);
                if (c.criticalPathVisible) {
                    c.showCriticalPath()
                }
            }
        },
        onFormCancelClick: function(a, c, b) {
            this.cancelForm()
        },
        cancelForm: function() {
            var c = this.lookupReference('itemsavebtn');
            c.setDisabled(!0);
            var a = this.lookupReference('formPanel');
            this.currentFormId = -1;
            this.formDirty = !1;
            a.hide();
            var b = this.lookupReference('formViewBtn');
            b.setPressed(!1);
            this.removeFormPanel()
        },
        onFormOKClick: function(h, j, i) {
            var d = this;
            var g = this.getView();
            var e = this.lookupReference('formContainer');
            var a = [];
            e.items.items.forEach(function(b) {
                if (b instanceof Ext.grid.Panel) {
                    var d = b.store.needsSync;
                    var c = b.store.getUpdatedRecords();
                    a = a.concat(c)
                }
            });
            var c = [];
            for (var b = 0; b < a.length; b++) {
                if (a[b].get('lookupType') == 'AGENT') {
                    c.push({
                        name: a[b].get('name'),
                        label: a[b].get('label'),
                        category: a[b].get('category'),
                        value: a[b].get('value'),
                        agentType: a[b].get('agentType'),
                        agentLogic: a[b].get('agentLogic')
                    })
                } else if (a[b].get('lookupType') == 'SFTP_OPERATION') {
                    c.push({
                        name: a[b].get('name'),
                        label: a[b].get('label'),
                        category: a[b].get('category'),
                        local_name: a[b].get('local_name'),
                        remote_name: a[b].get('remote_name')
                    })
                } else {
                    c.push({
                        name: a[b].get('name'),
                        label: a[b].get('label'),
                        category: a[b].get('category'),
                        value: a[b].get('value')
                    })
                }
            }
            if (c.length > 0) {
                var f = Ext.encode(c);
                Ext.Ajax.request({
                    disableCaching: !0,
                    method: 'PUT',
                    url: zena.baseURL + zena.serverName + '/processes/' + g.processId + '/items/' + this.currentFormId,
                    jsonData: f,
                    success: function(b, f) {
                        if (b.responseText != '') {
                            var c = Ext.decode(b.responseText);
                            if (c.success) {
                                Ext.helper.msg('Success', 'Updated item');
                                var a = d.lookupReference('itemsavebtn');
                                a.setDisabled(!0);
                                e.items.items.forEach(function(a) {
                                    if (a instanceof Ext.grid.Panel) {
                                        a.store.commitChanges()
                                    }
                                });
                                d.formDirty = !1;
                                var a = d.lookupReference('itemsavebtn');
                                a.setDisabled(!0)
                            } else {
                                Ext.create('widget.uxNotification', {
                                    position: 'tr',
                                    cls: 'ux-notification-light',
                                    iconCls: 'ux-notification-icon-information',
                                    closable: !1,
                                    title: '',
                                    header: !1,
                                    html: '<b>' + c.message + '</b>',
                                    slideInDuration: 800,
                                    slideBackDuration: 1200,
                                    autoCloseDelay: 6000
                                }).show()
                            }
                        } else {
                            Ext.helper.msg('Error', 'Updated failed')
                        }
                    },
                    failure: function(a, b) {
                        console.log('server-side failure with status code ' + a.status)
                    }
                })
            }
        },
        setFormDetails: function(d, g) {
            Ext.suspendLayouts();
            this.removeFormPanel();
            var c = this.lookupReference('formPanel');
            var b = this.lookupReference('formContainer');
            var f = this.lookupReference('formTitle');
            var h = this.getView();
            c.setTitle(this.currentFormAlias);
            var a = Ext.decode(d.responseText);
            this.currItemRec = a;
            grid = this.createGroupingGrid(a, 'GENERAL', !1);
            if (grid) {
                grid.destroy()
            }
            grid = this.createGroupingGrid(a, 'GENERAL', !1);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'AGENT', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'DETAILS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'OBJECTS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'OPERATIONS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'PROCESSES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'PARAMETERS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'FIELDS', !1);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'SEND PROPERTIES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'REPLY PROPERTIES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'PACKAGE VARIABLES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'PACKAGE ITEMS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'STEPS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'METADATA', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'CONDITIONS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'RESTART', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'STEP RESTART', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'OUTPUT', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'JCL TOKENS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'OTHER', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'DATA SOURCES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'ATTRIBUTES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'VARIABLES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'RESOURCES', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'REQUESTS', !0, !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createGroupingGrid(a, 'ACTIONS', !0);
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createDepGrid(a.dependencies, 'DEPENDENCIES');
            if (grid) {
                this.currentForm = b.add(grid)
            }
            grid = this.createDepGrid(a.dependents, 'DEPENDENTS');
            if (grid) {
                this.currentForm = b.add(grid)
            }
            if (!c.isVisible()) {
                var e = this.lookupReference('formViewBtn');
                e.setPressed(!0);
                c.show()
            }
            Ext.resumeLayouts(!0)
        },
        createDepGrid: function(b, e) {
            var c = null;
            var a = this;
            if (b == undefined || b.length == 0) {
                return c
            }
            var d = Ext.create('zena.store.ProcessItems', {});
            d.add(b);
            c = Ext.create('Ext.grid.Panel', {
                collapsible: !0,
                collapsed: !0,
                ui: 'processitempanel',
                frame: !1,
                flex: 1,
                margin: '0 5 5 5',
                store: d,
                title: _t(e, e),
                hideHeaders: !0,
                header: !0,
                columns: [{
                    xtype: 'gridcolumn',
                    renderer: function(a, c, g, f, d, h, i) {
                        c.tdCls = zena.util.Defs.getStatusColorCls(a);
                        a = '?';
                        return a
                    },
                    width: 40,
                    resizable: !1,
                    sortable: !1,
                    menuDisabled: !0,
                    hideable: !1,
                    dataIndex: 'colorId'
                }, {
                    xtype: 'gridcolumn',
                    flex: 1,
                    dataIndex: 'alias',
                    text: _c('Alias', 'Alias'),
                    renderer: function(d, a, c, g, f, h, i) {
                        if (c.get('isChild')) {
                            a.tdCls = 'alias-ischild'
                        }
                        return Ext.htmlEncode(d)
                    }
                }],
                listeners: {
                    containercontextmenu: function(c, a) {
                        a.stopEvent()
                    },
                    rowcontextmenu: function(g, c, j, h, f, i) {
                        var d = [];
                        d.length = 0;
                        d.push({
                            id: c.get('id'),
                            alias: c.get('alias'),
                            itemType: c.get('itemTypeId'),
                            status: c.get('statusId'),
                            uid: c.get('uid')
                        });
                        a.selectedIds = d;
                        f.stopEvent();
                        a.showGridMenu(f.getX(), f.getY())
                    },
                    rowdblclick: function(g, f, j, h, k, i) {
                        if (a.isItemsView()) {
                            var c = a.lookupReference('itemssearch');
                            if (c) {
                                c.setValue('#' + f.get('id'));
                                c.onSearchClick()
                            }
                        } else {
                            var d = a.lookupReference('chartPanel');
                            if (d) {
                                d.selectNode(f.get('uid'))
                            }
                        }
                    }
                }
            });
            return c
        },
        renderTip: function(a, b, c, e, d, f) {
            b.tdAttr = 'data-qtip="' + a + ' : ' + c.data.value + '"';
            return a
        },
        onDataChanged: function(a) {},
        onDataUpdated: function(g, e, c, b, d, f) {
            this.formDirty = !0;
            var a = this.lookupReference('itemsavebtn');
            a.setDisabled(!1)
        },
        createGroupingGrid2: function(i, d, g, h) {
            var b = null;
            var a = this;
            var c = Ext.create('zena.store.ProcessItemFields', {
                filters: [{
                    property: 'category',
                    value: d
                }]
            });
            c.add(i.items);
            if (c.getCount() == 0) {
                c.destroy();
                return b
            }
            c.on('update', this.onDataUpdated, this);
            var j = Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1,
                listeners: {
                    beforeedit: function(c, b, e) {
                        a.currItemValue = b.record
                    },
                    scope: this
                }
            });
            var f = 4;
            var e = 6;
            if (h) {
                f = 6;
                e = 4
            }
            b = Ext.create('Ext.grid.Panel', {
                viewConfig: {
                    enableTextSelection: !0
                },
                collapsible: !0,
                collapsed: g,
                frame: !1,
                ui: 'processitempanel',
                flex: 1,
                store: c,
                margin: '0 5 5 5',
                title: _t(d, d),
                hideHeaders: !0,
                header: !0,
                listeners: {
                    rowdblclick: {
                        fn: function(b, a, f, c, j, e) {
                            a.set('value', a.get('value') + '$loginurl\n $loginudrl?\n$loginurl\n$loginurl')
                        }
                    }
                },
                columns: [{
                    text: _c('Name', 'Name'),
                    flex: f,
                    dataIndex: 'label',
                    renderer: this.renderTip
                }, {
                    text: _c('Value', 'Value'),
                    flex: e,
                    dataIndex: 'display',
                    renderer: Ext.htmlEncode,
                    feditors: {
                        'default': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                listeners: {
                                    change: function(f, b, c, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                }
                            })
                        }),
                        'DISPLAY': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1
                            })
                        }),
                        'TEXT': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'textfield',
                            listeners: {
                                change: function(f, b, c, e) {
                                    a.currItemValue.set('value', b)
                                }
                            }
                        }),
                        'NUMBER': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'numberfield',
                            listeners: {
                                change: function(f, b, c, e) {
                                    a.currItemValue.set('value', b)
                                }
                            }
                        }),
                        'DATE': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'datefield'
                        }),
                        'AGENT': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-search-trigger',
                                        handler: function(f, e, j) {
                                            var b = {
                                                name: a.currItemValue.get('value'),
                                                uid: a.currItemValue.get('name'),
                                                type: a.currItemValue.get('agentType'),
                                                logic: a.currItemValue.get('agentLogic')
                                            };
                                            var c = Ext.create('widget.selectagentitemform', {
                                                listeners: {
                                                    itemSelected: function(b, l, k, c) {
                                                        a.currItemValue.set('value', k);
                                                        a.currItemValue.set('name', l);
                                                        a.currItemValue.set('agentType', b);
                                                        if (b == 'LIST') {
                                                            a.currItemValue.set('agentLogic', c)
                                                        }
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        agent: b,
                                                        isProcessItemDef: !1,
                                                        itemType: a.currentItemTypeId
                                                    }
                                                }
                                            });
                                            c.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'STEP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            var b = Ext.create('widget.runstepform', {
                                                title: a.currItemValue.get('category'),
                                                viewModel: {
                                                    data: {
                                                        varName: a.currItemValue.get('label'),
                                                        varStatus: a.currItemValue.get('status'),
                                                        varStarted: a.currItemValue.get('started'),
                                                        varCompleted: a.currItemValue.get('completed')
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'MF_STEP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            var b = Ext.create('widget.genericfieldform', {
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        label1: 'Step',
                                                        value1: a.currItemValue.get('step_name'),
                                                        label2: 'Procedure',
                                                        value2: a.currItemValue.get('proc_name'),
                                                        label3: 'Status',
                                                        value3: a.currItemValue.get('native_status'),
                                                        label4: 'Value',
                                                        value4: a.currItemValue.get('step_value')
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'SFTP_OPERATION': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            var b = Ext.create('widget.sftpoprunform', {
                                                title: 'SFTP ' + a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        rec: a.currItemValue
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'TEXTPARM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !0,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, j) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var c = Ext.create('widget.variableeditform', {
                                                title: 'Parameter',
                                                listeners: {
                                                    itemUpdated: function(c, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        varUID: a.currItemValue.get('name'),
                                                        varName: a.currItemValue.get('label'),
                                                        varType: a.currItemValue.get('extType'),
                                                        varDirection: a.currItemValue.get('direction'),
                                                        varHasDirection: a.currItemValue.get('lookupType') == 'DIR_PARAM',
                                                        varValue: a.currItemValue.get('value'),
                                                        varCanEdit: b,
                                                        isText: !0
                                                    }
                                                }
                                            });
                                            c.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'NUMBERPARM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Number', {
                                editable: !0,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            var b = Ext.create('widget.variableeditform', {
                                                title: 'Parameter',
                                                listeners: {
                                                    itemUpdated: function(j, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        varUID: a.currItemValue.get('name'),
                                                        varName: a.currItemValue.get('label'),
                                                        varType: a.currItemValue.get('extType'),
                                                        varDirection: a.currItemValue.get('direction'),
                                                        varValue: a.currItemValue.get('value'),
                                                        varCanEdit: !0,
                                                        isText: !1
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'DROPDOWN': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.ComboBox', {
                                queryMode: 'local',
                                displayField: 'value',
                                editable: !0,
                                valueField: 'value',
                                store: Ext.create('Ext.data.Store', {
                                    type: 'array',
                                    fields: ['value'],
                                    data: [
                                        ['val1'],
                                        ['val2']
                                    ]
                                })
                            })
                        }),
                        'DROPDOWN2': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'combobox',
                            queryMode: 'local',
                            displayField: 'label',
                            valueField: 'value',
                            store: Ext.create('Ext.data.Store', {
                                fields: ['label', 'value'],
                                data: [{
                                    label: 'agent1',
                                    value: 'id1'
                                }, {
                                    label: 'agent2',
                                    value: 'id2'
                                }]
                            })
                        }),
                        'TEXT_DELIM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, j) {
                                            var b = ',';
                                            if (a.currItemValue.get('lookupType') == 'TEXT_SEMICOLON_DELIM') {
                                                b = ';'
                                            }
                                            var c = Ext.create('widget.delimiterform', {
                                                listeners: {
                                                    delimitedSelected: function(c, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        values: a.currItemValue.get('value'),
                                                        delimiter: b
                                                    }
                                                }
                                            });
                                            c.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'TIMES': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            var b = Ext.create('widget.timerangesform', {
                                                listeners: {
                                                    timeRangesSelected: function(j, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        times: a.currItemValue.get('value'),
                                                        allowPartial: !0
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'DETAILS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(l, k, m) {
                                            var f = a.getView();
                                            var b = '';
                                            var e = 450,
                                                c = 300;
                                            if (a.currItemValue.get('lookupType') == 'JCL_DETAILS') {
                                                b = 'zenafixed';
                                                e = 700;
                                                c = 500
                                            }
                                            var j = Ext.create('widget.processinforeqform', {
                                                width: e,
                                                height: c,
                                                cls: b,
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        processId: f.processId,
                                                        itemId: a.currentFormId
                                                    }
                                                }
                                            });
                                            j.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'RESTART_DETAILS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, j) {
                                            var b = a.getView();
                                            var c = Ext.create('widget.zebbrestartform', {
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        processId: b.processId,
                                                        itemId: a.currentFormId
                                                    }
                                                }
                                            });
                                            c.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'EXT_EDIT': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'zf-field icon-modify',
                                        handler: function(l, k, m) {
                                            a.currItemValue.set('value', a.currItemValue.get('value') + '$loginurl\n $loginudrl?\n$loginurl\n$loginurl');
                                            return;
                                            var j = '';
                                            var e = 450,
                                                c = 300;
                                            if (a.currItemValue.get('lookupType') == 'SCRIPT') {
                                                var f = Ext.create('widget.scripteditform', {
                                                    title: dlgTitle,
                                                    config: {
                                                        scriptValue: a.currItemValue.get('value'),
                                                        scriptType: 'Text'
                                                    },
                                                    listeners: {
                                                        updateScript: function(c) {
                                                            b.getStore().beginUpdate();
                                                            a.currItemValue.set('value', c);
                                                            b.getStore().endUpdate()
                                                        }
                                                    }
                                                });
                                                f.show()
                                            } else {
                                                if (a.currItemValue.get('lookupType') == 'EXT_EDIT') {
                                                    e = 550;
                                                    c = 450
                                                } else if (a.currItemValue.get('lookupType') == 'SOURCE_CODE') {
                                                    j = 'zenafixed';
                                                    e = 700;
                                                    c = 500
                                                }
                                                var f = Ext.create('widget.extendededitform', {
                                                    width: e,
                                                    height: c,
                                                    cls: j,
                                                    title: a.currItemValue.get('label'),
                                                    listeners: {
                                                        updateText: function(e, c) {
                                                            b.getStore().beginUpdate();
                                                            a.currItemValue.set('value', c);
                                                            b.getStore().endUpdate()
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            textvalue: a.currItemValue.get('value'),
                                                            closeLabel: _b('Cancel', 'Cancel')
                                                        }
                                                    }
                                                });
                                                f.show()
                                            }
                                        }
                                    }
                                }
                            })
                        }),
                        'EXT_MEMO': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                maxHeight: 30,
                                listeners: {
                                    change: function(f, b, c, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                },
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'zf-field icon-modify',
                                        handler: function(k, j, l) {
                                            var f = '';
                                            var c = 450,
                                                b = 300;
                                            if (a.currItemValue.get('editType') == 'SCRIPT') {
                                                var e = Ext.create('widget.scripteditform', {
                                                    title: a.currItemValue.get('label'),
                                                    config: {
                                                        scriptValue: a.currItemValue.get('value'),
                                                        scriptType: 'Script'
                                                    },
                                                    listeners: {
                                                        updateScript: function(b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    }
                                                });
                                                e.show()
                                            } else {
                                                if (a.currItemValue.get('editType') == 'MEMO') {
                                                    c = 550;
                                                    b = 450
                                                } else if (a.currItemValue.get('lookupType') == 'SOURCE_CODE') {
                                                    f = 'zenafixed';
                                                    c = 700;
                                                    b = 500
                                                }
                                                var e = Ext.create('widget.extendededitform', {
                                                    width: c,
                                                    height: b,
                                                    cls: f,
                                                    title: a.currItemValue.get('label'),
                                                    listeners: {
                                                        updateText: function(c, b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            textvalue: a.currItemValue.get('value'),
                                                            closeLabel: _b('Cancel', 'Cancel')
                                                        }
                                                    }
                                                });
                                                e.show()
                                            }
                                        }
                                    }
                                }
                            })
                        }),
                        'SAP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, j) {
                                            if (a.currItemValue.get('lookupType') == 'SAP_ABAP_STEP') {
                                                var c = Ext.create('Ext.data.Store', {
                                                    type: 'array',
                                                    fields: ['name', 'value'],
                                                    data: a.currItemValue.get('parameters')
                                                });
                                                var b = Ext.create('widget.sapabapstepform', {
                                                    width: 500,
                                                    height: 430,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            variant: a.currItemValue.get('variantName')
                                                        },
                                                        stores: {
                                                            params: c
                                                        }
                                                    }
                                                })
                                            } else if (a.currItemValue.get('lookupType') == 'SAP_EXTCMD_STEP') {
                                                var b = Ext.create('widget.sapstepform', {
                                                    width: 500,
                                                    height: 350,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            parameters: a.currItemValue.get('parameters')
                                                        }
                                                    }
                                                })
                                            } else if (a.currItemValue.get('lookupType') == 'SAP_EXTPGM_STEP') {
                                                var b = Ext.create('widget.sapstepform', {
                                                    width: 500,
                                                    height: 350,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            parameters: a.currItemValue.get('parameters')
                                                        }
                                                    }
                                                })
                                            }
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'ORACLE': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, j) {
                                            var b = Ext.create('Ext.data.Store', {
                                                type: 'array',
                                                fields: ['name', 'value'],
                                                data: a.currItemValue.get('parameters')
                                            });
                                            var c = Ext.create('widget.oraclerequestform', {
                                                width: 500,
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        requestname: a.currItemValue.get('name'),
                                                        stagename: a.currItemValue.get('stageName'),
                                                        stagestatus: a.currItemValue.get('stageStatus'),
                                                        requeststatus: a.currItemValue.get('value')
                                                    },
                                                    stores: {
                                                        params: b
                                                    }
                                                }
                                            });
                                            c.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'PS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, c, f) {
                                            if (a.currItemValue.get('lookupType') == 'PS_PARAM') {
                                                var b = Ext.create('widget.genericfieldform', {
                                                    title: a.currItemValue.get('label') + ' Parameter',
                                                    viewModel: {
                                                        data: {
                                                            label1: 'Name',
                                                            value1: a.currItemValue.get('label'),
                                                            label2: 'Field',
                                                            value2: a.currItemValue.get('field_name'),
                                                            label3: 'Record',
                                                            value3: a.currItemValue.get('record_name'),
                                                            label4: 'Type',
                                                            value4: a.currItemValue.get('dataType'),
                                                            label5: 'Value',
                                                            value5: a.currItemValue.get('value')
                                                        }
                                                    }
                                                });
                                                b.show()
                                            } else if (a.currItemValue.get('lookupType') == 'PS_PROCESS') {
                                                var b = Ext.create('widget.genericfieldform', {
                                                    title: a.currItemValue.get('label') + ' Process',
                                                    height: 330,
                                                    viewModel: {
                                                        data: {
                                                            label1: 'Name',
                                                            value1: a.currItemValue.get('label'),
                                                            label2: 'Type',
                                                            value2: a.currItemValue.get('type'),
                                                            label3: 'Status',
                                                            value3: a.currItemValue.get('value'),
                                                            label6: 'Description',
                                                            value6: a.currItemValue.get('description')
                                                        }
                                                    }
                                                });
                                                b.show()
                                            }
                                        }
                                    }
                                }
                            })
                        })
                    },
                    getEditor: function(a) {
                        if (a.get('editType') == 'SCRIPT') {
                            return this.feditors['EXT_MEMO']
                        } else if (a.get('editType') == 'MEMO') {
                            return this.feditors['EXT_MEMO']
                        } else if (a.get('editType') == 'DROPDOWN') {
                            var f = a.get('values').split(',');
                            var j = this.feditors['DROPDOWN'];
                            var e = j.field.getStore();
                            e.clearData();
                            var c = [];
                            for (var b = 0; b < f.length; b++) {
                                c.push({
                                    value: f[b]
                                })
                            }
                            e.loadData(c);
                            return j
                        } else if (a.get('lookupType') == 'PS_PROCESS') {
                            return this.feditors['PS']
                        } else if (a.get('lookupType') == 'PS_PARAM') {
                            return this.feditors['PS']
                        } else if (a.get('lookupType') == 'SAP_ABAP_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'ORACLE_REQUEST') {
                            return this.feditors['ORACLE']
                        } else if (a.get('lookupType') == 'SAP_EXTPGM_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'SAP_EXTCMD_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'DIR_PARAM') {
                            return this.feditors['TEXTPARM']
                        } else if (a.get('lookupType') == 'PARAM') {
                            return this.feditors['TEXTPARM']
                        } else if (a.get('lookupType') == 'TEXT_SEMICOLON_DELIM') {
                            return this.feditors['TEXT_DELIM']
                        } else if (a.get('lookupType') == 'TEXT_DELIM') {
                            return this.feditors['TEXT_DELIM']
                        } else if (a.get('lookupType') == 'SFTP_OPERATION') {
                            return this.feditors['SFTP_OPERATION']
                        } else if (a.get('lookupType') == 'EXT_EDIT') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'SOURCE_CODE') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'TIMES') {
                            return this.feditors['TIMES']
                        } else if (a.get('lookupType') == 'EDIT') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'AGENT') {
                            return this.feditors['AGENT']
                        } else if (a.get('lookupType') == 'MAINFRAME_STEP') {
                            return this.feditors['MF_STEP']
                        } else if (a.get('lookupType') == 'DETAILS') {
                            return this.feditors['DETAILS']
                        } else if (a.get('lookupType') == 'JCL_DETAILS') {
                            return this.feditors['DETAILS']
                        } else if (a.get('lookupType') == 'RESTART_DETAILS') {
                            return this.feditors['RESTART_DETAILS']
                        } else if (a.get('lookupType') == 'SQL_STEP') {
                            return this.feditors['STEP']
                        } else if (a.get('editType') == 'TEXT') {
                            return this.feditors['default']
                        } else if (a.get('editType') in this.feditors) {
                            return this.feditors[a.get('editType')]
                        } else {
                            return this.feditors['default']
                        }
                    },
                    editor: {
                        xtype: 'textfield'
                    }
                }]
            });
            return b
        },
        removeFormPanel: function() {
            var a = this.lookupReference('formContainer');
            if (this.currentForm) {
                var b;
                while (b = a.items.first()) {
                    a.remove(b, !0)
                }
                a.items.clear();
                this.currentForm = null
            }
        },
        onGetRowClass: function(a) {
            return ''
        },
        onViewPDF: function() {
            var a = this.lookupReference('itemsGrid');
            zena.util.Defs.viewReport('PDF', 'Report', a.getStore(), a.getVisibleColumns())
        },
        onViewHTML: function() {
            var a = this.lookupReference('itemsGrid');
            zena.util.Defs.viewReport('HTML', 'Report', a.getStore(), a.getVisibleColumns())
        },
        onViewCSV: function() {
            var a = this.lookupReference('itemsGrid');
            zena.util.Defs.viewReport('CSV', 'Report', a.getStore(), a.getVisibleColumns())
        },
        processViewHistory: function(e, d, f, c) {
            var a = this.selectedIds[0];
            if (a.id == 0) {
                var b = Ext.create('widget.selecthistorycriteria', {
                    viewModel: {
                        data: {
                            processId: this.getView().processId,
                            itemId: 0,
                            name: this.processName,
                            processDefId: this.processDefId,
                            startDate: new Date(),
                            startDateFlag: !0,
                            untilDate: new Date(),
                            untilDateFlag: !0,
                            isProcessItem: !1
                        }
                    }
                })
            } else {
                var b = Ext.create('widget.selecthistorycriteria', {
                    viewModel: {
                        data: {
                            processId: this.getView().processId,
                            itemId: a.id,
                            name: this.processName + '.' + a.alias,
                            processDefId: this.processDefId,
                            startDate: new Date(),
                            startDateFlag: !0,
                            untilDate: new Date(),
                            untilDateFlag: !0,
                            isProcessItem: !0
                        }
                    }
                })
            }
            b.show()
        },
        beforeSelect: function(d, a, c, b) {},
        createGroupingGrid: function(j, c, h, i) {
            var d = null;
            var a = this;
            var b = Ext.create('zena.store.ProcessItemFields', {
                filters: [{
                    property: 'category',
                    value: c
                }]
            });
            b.add(j.items);
            if (b.getCount() == 0) {
                b.destroy();
                return d
            }
            b.on('update', this.onDataUpdated, this);
            var f = 4;
            var e = 6;
            if (i) {
                f = 6;
                e = 4
            }
            var g = Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1,
                listeners: {
                    beforeedit: function(d, b, e) {
                        a.currItemValue = b.record
                    },
                    scope: this
                }
            });
            d = Ext.create('Ext.grid.Panel', {
                viewConfig: {
                    enableTextSelection: !0
                },
                collapsible: !0,
                collapsed: h,
                frame: !1,
                ui: 'processitempanel',
                selModel: 'cellmodel',
                flex: 1,
                store: b,
                margin: '0 5 5 5',
                title: _t(c, c),
                hideHeaders: !0,
                header: !0,
                plugins: [g],
                columns: [{
                    text: _c('Name', 'Name'),
                    flex: f,
                    dataIndex: 'label'
                }, {
                    text: _c('Value', 'Value'),
                    flex: e,
                    dataIndex: 'display',
                    renderer: function(a, d, b) {
                        if (b.get('label') == 'Times' && !a) {
                            return '&lt;Click to set time range>'
                        }
                        return Ext.htmlEncode(a)
                    },
                    feditors: {
                        'default': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                listeners: {
                                    change: function(f, b, d, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                }
                            })
                        }),
                        'DISPLAY': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1
                            })
                        }),
                        'EXTDISPLAY': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'zf-field icon-modify',
                                        handler: function(f, e, g) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = Ext.create('widget.extendededitform', {
                                                width: 450,
                                                height: 300,
                                                title: a.currItemValue.get('label'),
                                                listeners: {
                                                    updateText: function(b, a) {}
                                                },
                                                viewModel: {
                                                    data: {
                                                        textvalue: a.currItemValue.get('value'),
                                                        hasOkay: !1,
                                                        closeLabel: _b('Close', 'Close'),
                                                        canEdit: b,
                                                        hasOkay: b
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'TEXT': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'textfield',
                            listeners: {
                                change: function(f, b, d, e) {
                                    a.currItemValue.set('value', b)
                                }
                            }
                        }),
                        'NUMBER': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'numberfield',
                            listeners: {
                                change: function(f, b, d, e) {
                                    a.currItemValue.set('value', b)
                                }
                            }
                        }),
                        'DATE': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Date', {
                                format: 'Y.m.d',
                                listeners: {
                                    change: function(f, b, d, e) {
                                        a.currItemValue.set('value', Ext.util.Format.date(b, 'Y.m.d'))
                                    }
                                }
                            })
                        }),
                        'EXT_EDIT': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'zf-field icon-modify',
                                        handler: function(l, k, m) {
                                            var g = '';
                                            var e = 450,
                                                d = 300;
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            if (a.currItemValue.get('lookupType') == 'SCRIPT') {
                                                var f = Ext.create('widget.scripteditform', {
                                                    title: dlgTitle,
                                                    config: {
                                                        scriptValue: a.currItemValue.get('value'),
                                                        scriptType: 'Text'
                                                    },
                                                    listeners: {
                                                        updateScript: function(b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            hasOkay: b
                                                        }
                                                    }
                                                });
                                                f.show()
                                            } else {
                                                if (a.currItemValue.get('lookupType') == 'EXT_EDIT') {
                                                    e = 550;
                                                    d = 450
                                                } else if (a.currItemValue.get('lookupType') == 'SOURCE_CODE') {
                                                    g = 'zenafixed';
                                                    e = 700;
                                                    d = 500
                                                }
                                                var f = Ext.create('widget.extendededitform', {
                                                    width: e,
                                                    height: d,
                                                    cls: g,
                                                    title: a.currItemValue.get('label'),
                                                    listeners: {
                                                        updateText: function(d, b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            textvalue: a.currItemValue.get('value'),
                                                            closeLabel: _b('Cancel', 'Cancel'),
                                                            canEdit: b,
                                                            hasOkay: b
                                                        }
                                                    }
                                                });
                                                f.show()
                                            }
                                        }
                                    }
                                }
                            })
                        }),
                        'AGENT': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-search-trigger',
                                        handler: function(f, e, g) {
                                            if (a.currItemValue.get('editType') != 'DISPLAY') {
                                                var b = {
                                                    name: a.currItemValue.get('value'),
                                                    uid: a.currItemValue.get('name'),
                                                    type: a.currItemValue.get('agentType'),
                                                    logic: a.currItemValue.get('agentLogic')
                                                };
                                                var d = Ext.create('widget.selectagentitemform', {
                                                    listeners: {
                                                        itemSelected: function(b, l, k, d) {
                                                            a.currItemValue.set('value', k);
                                                            a.currItemValue.set('name', l);
                                                            a.currItemValue.set('agentType', b);
                                                            if (b == 'LIST') {
                                                                a.currItemValue.set('agentLogic', d)
                                                            }
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            agent: b,
                                                            isProcessItemDef: !1,
                                                            itemType: a.currentItemTypeId
                                                        }
                                                    }
                                                });
                                                d.show()
                                            }
                                        }
                                    }
                                }
                            })
                        }),
                        'STEP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, d, f) {
                                            var b = Ext.create('widget.runstepform', {
                                                title: a.currItemValue.get('category'),
                                                viewModel: {
                                                    data: {
                                                        varName: a.currItemValue.get('label'),
                                                        varStatus: a.currItemValue.get('status'),
                                                        varStarted: a.currItemValue.get('started'),
                                                        varCompleted: a.currItemValue.get('completed')
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'MF_STEP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, d, f) {
                                            var b = Ext.create('widget.genericfieldform', {
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        label1: 'Step',
                                                        value1: a.currItemValue.get('step_name'),
                                                        label2: 'Procedure',
                                                        value2: a.currItemValue.get('proc_name'),
                                                        label3: 'Status',
                                                        value3: a.currItemValue.get('native_status'),
                                                        label4: 'Value',
                                                        value4: a.currItemValue.get('step_value')
                                                    }
                                                }
                                            });
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'SFTP_OPERATION': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = Ext.create('widget.sftpoprunform', {
                                                title: 'SFTP ' + a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        rec: a.currItemValue,
                                                        canEdit: b,
                                                        hasOkay: b
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'TEXTPARM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !0,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = Ext.create('widget.variableeditform', {
                                                title: 'Parameter',
                                                listeners: {
                                                    itemUpdated: function(d, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        varUID: a.currItemValue.get('name'),
                                                        varName: a.currItemValue.get('label'),
                                                        varType: a.currItemValue.get('extType'),
                                                        varDirection: a.currItemValue.get('direction'),
                                                        varHasDirection: a.currItemValue.get('lookupType') == 'DIR_PARAM',
                                                        varValue: a.currItemValue.get('value'),
                                                        varCanEdit: b,
                                                        isText: !0
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'NUMBERPARM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Number', {
                                editable: !0,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = Ext.create('widget.variableeditform', {
                                                title: 'Parameter',
                                                listeners: {
                                                    itemUpdated: function(d, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        varUID: a.currItemValue.get('name'),
                                                        varName: a.currItemValue.get('label'),
                                                        varType: a.currItemValue.get('extType'),
                                                        varDirection: a.currItemValue.get('direction'),
                                                        varValue: a.currItemValue.get('value'),
                                                        varCanEdit: b,
                                                        isText: !1
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'DROPDOWN': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.ComboBox', {
                                queryMode: 'local',
                                editable: !1,
                                displayField: 'value',
                                publishes: 'value',
                                valueField: 'value',
                                listeners: {
                                    change: function(f, b, d, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                },
                                store: Ext.create('Ext.data.Store', {
                                    type: 'array',
                                    fields: ['value'],
                                    data: [
                                        ['val1'],
                                        ['val2']
                                    ]
                                })
                            })
                        }),
                        'DROPDOWN2': Ext.create('Ext.grid.CellEditor', {
                            xtype: 'combobox',
                            queryMode: 'local',
                            displayField: 'label',
                            valueField: 'value',
                            store: Ext.create('Ext.data.Store', {
                                fields: ['label', 'value'],
                                data: [{
                                    label: 'agent1',
                                    value: 'id1'
                                }, {
                                    label: 'agent2',
                                    value: 'id2'
                                }]
                            })
                        }),
                        'TEXT_DELIM': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                listeners: {
                                    change: function(f, b, d, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                },
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(g, f, k) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = ',';
                                            if (a.currItemValue.get('lookupType') == 'TEXT_SEMICOLON_DELIM') {
                                                d = ';'
                                            }
                                            var e = Ext.create('widget.delimiterform', {
                                                canEdit: b,
                                                listeners: {
                                                    delimitedSelected: function(d, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        values: a.currItemValue.get('value'),
                                                        delimiter: d
                                                    }
                                                }
                                            });
                                            e.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'TIMES': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var d = Ext.create('widget.timerangesform', {
                                                canEdit: b,
                                                listeners: {
                                                    timeRangesSelected: function(d, b) {
                                                        a.currItemValue.set('value', b)
                                                    }
                                                },
                                                viewModel: {
                                                    data: {
                                                        times: a.currItemValue.get('value'),
                                                        allowPartial: !0
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'DETAILS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(l, k, m) {
                                            var f = a.getView();
                                            var b = '';
                                            var e = 450,
                                                d = 300;
                                            if (a.currItemValue.get('lookupType') == 'JCL_DETAILS') {
                                                b = 'zenafixed';
                                                e = 700;
                                                d = 500
                                            }
                                            var g = Ext.create('widget.processinforeqform', {
                                                width: e,
                                                height: d,
                                                cls: b,
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        processId: f.processId,
                                                        itemId: a.currentFormId
                                                    }
                                                }
                                            });
                                            g.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'RESTART_DETAILS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = a.getView();
                                            var d = Ext.create('widget.zebbrestartform', {
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        processId: b.processId,
                                                        itemId: a.currentFormId
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'EXT_MEMO': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                maxHeight: 30,
                                listeners: {
                                    change: function(f, b, d, e) {
                                        a.currItemValue.set('value', b)
                                    }
                                },
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'zf-field icon-modify',
                                        handler: function(l, k, m) {
                                            var b = !0;
                                            if (a.currItemValue.get('editType') == 'DISPLAY') {
                                                b = !1
                                            }
                                            var g = '';
                                            var e = 450,
                                                d = 300;
                                            if (a.currItemValue.get('editType') == 'SCRIPT') {
                                                var f = Ext.create('widget.scripteditform', {
                                                    title: a.currItemValue.get('label'),
                                                    config: {
                                                        scriptValue: a.currItemValue.get('value'),
                                                        scriptType: 'Script'
                                                    },
                                                    listeners: {
                                                        updateScript: function(b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            hasOkay: b
                                                        }
                                                    }
                                                });
                                                f.show()
                                            } else {
                                                if (a.currItemValue.get('editType') == 'MEMO') {
                                                    e = 550;
                                                    d = 450
                                                } else if (a.currItemValue.get('lookupType') == 'SOURCE_CODE') {
                                                    g = 'zenafixed';
                                                    e = 700;
                                                    d = 500
                                                }
                                                var f = Ext.create('widget.extendededitform', {
                                                    width: e,
                                                    height: d,
                                                    cls: g,
                                                    title: a.currItemValue.get('label'),
                                                    listeners: {
                                                        updateText: function(d, b) {
                                                            a.currItemValue.set('value', b)
                                                        }
                                                    },
                                                    viewModel: {
                                                        data: {
                                                            textvalue: a.currItemValue.get('value'),
                                                            closeLabel: _b('Cancel', 'Cancel'),
                                                            canEdit: b,
                                                            hasOkay: b
                                                        }
                                                    }
                                                });
                                                f.show()
                                            }
                                        }
                                    }
                                }
                            })
                        }),
                        'SAP': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            if (a.currItemValue.get('lookupType') == 'SAP_ABAP_STEP') {
                                                var d = Ext.create('Ext.data.Store', {
                                                    type: 'array',
                                                    fields: ['name', 'value'],
                                                    data: a.currItemValue.get('parameters')
                                                });
                                                var b = Ext.create('widget.sapabapstepform', {
                                                    width: 500,
                                                    height: 430,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            variant: a.currItemValue.get('variantName')
                                                        },
                                                        stores: {
                                                            params: d
                                                        }
                                                    }
                                                })
                                            } else if (a.currItemValue.get('lookupType') == 'SAP_EXTCMD_STEP') {
                                                var b = Ext.create('widget.sapstepform', {
                                                    width: 500,
                                                    height: 350,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            parameters: a.currItemValue.get('parameters')
                                                        }
                                                    }
                                                })
                                            } else if (a.currItemValue.get('lookupType') == 'SAP_EXTPGM_STEP') {
                                                var b = Ext.create('widget.sapstepform', {
                                                    width: 500,
                                                    height: 350,
                                                    title: a.currItemValue.get('label'),
                                                    viewModel: {
                                                        data: {
                                                            program: a.currItemValue.get('name'),
                                                            parameters: a.currItemValue.get('parameters')
                                                        }
                                                    }
                                                })
                                            }
                                            b.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'ORACLE': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(f, e, g) {
                                            var b = Ext.create('Ext.data.Store', {
                                                type: 'array',
                                                fields: ['name', 'value'],
                                                data: a.currItemValue.get('parameters')
                                            });
                                            var d = Ext.create('widget.oraclerequestform', {
                                                width: 500,
                                                title: a.currItemValue.get('label'),
                                                viewModel: {
                                                    data: {
                                                        requestname: a.currItemValue.get('name'),
                                                        stagename: a.currItemValue.get('stageName'),
                                                        stagestatus: a.currItemValue.get('stageStatus'),
                                                        requeststatus: a.currItemValue.get('value')
                                                    },
                                                    stores: {
                                                        params: b
                                                    }
                                                }
                                            });
                                            d.show()
                                        }
                                    }
                                }
                            })
                        }),
                        'PS': Ext.create('Ext.grid.CellEditor', {
                            field: Ext.create('Ext.form.field.Text', {
                                editable: !1,
                                triggers: {
                                    expand: {
                                        weight: 1,
                                        cls: 'x-form-ellipsis-trigger',
                                        handler: function(e, d, f) {
                                            if (a.currItemValue.get('lookupType') == 'PS_PARAM') {
                                                var b = Ext.create('widget.genericfieldform', {
                                                    title: a.currItemValue.get('label') + ' Parameter',
                                                    viewModel: {
                                                        data: {
                                                            label1: 'Name',
                                                            value1: a.currItemValue.get('label'),
                                                            label2: 'Field',
                                                            value2: a.currItemValue.get('field_name'),
                                                            label3: 'Record',
                                                            value3: a.currItemValue.get('record_name'),
                                                            label4: 'Type',
                                                            value4: a.currItemValue.get('dataType'),
                                                            label5: 'Value',
                                                            value5: a.currItemValue.get('value')
                                                        }
                                                    }
                                                });
                                                b.show()
                                            } else if (a.currItemValue.get('lookupType') == 'PS_PROCESS') {
                                                var b = Ext.create('widget.genericfieldform', {
                                                    title: a.currItemValue.get('label') + ' Process',
                                                    height: 330,
                                                    viewModel: {
                                                        data: {
                                                            label1: 'Name',
                                                            value1: a.currItemValue.get('label'),
                                                            label2: 'Type',
                                                            value2: a.currItemValue.get('type'),
                                                            label3: 'Status',
                                                            value3: a.currItemValue.get('value'),
                                                            label6: 'Description',
                                                            value6: a.currItemValue.get('description')
                                                        }
                                                    }
                                                });
                                                b.show()
                                            }
                                        }
                                    }
                                }
                            })
                        })
                    },
                    getEditor: function(a) {
                        if (a.get('editType') == 'SCRIPT') {
                            return this.feditors['EXT_MEMO']
                        } else if (a.get('editType') == 'MEMO') {
                            return this.feditors['EXT_MEMO']
                        } else if (a.get('editType') == 'DATE') {
                            return this.feditors['DATE']
                        } else if (a.get('editType') == 'DROPDOWN') {
                            var f = a.get('values').split(',');
                            var g = this.feditors['DROPDOWN'];
                            var e = g.field.getStore();
                            e.clearData();
                            var d = [];
                            for (var b = 0; b < f.length; b++) {
                                d.push({
                                    value: f[b]
                                })
                            }
                            e.loadData(d);
                            return g
                        } else if (a.get('lookupType') == 'PS_PROCESS') {
                            return this.feditors['PS']
                        } else if (a.get('lookupType') == 'PS_PARAM') {
                            return this.feditors['PS']
                        } else if (a.get('lookupType') == 'SAP_ABAP_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'ORACLE_REQUEST') {
                            return this.feditors['ORACLE']
                        } else if (a.get('lookupType') == 'SAP_EXTPGM_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'SAP_EXTCMD_STEP') {
                            return this.feditors['SAP']
                        } else if (a.get('lookupType') == 'DIR_PARAM') {
                            return this.feditors['TEXTPARM']
                        } else if (a.get('lookupType') == 'PARAM') {
                            return this.feditors['TEXTPARM']
                        } else if (a.get('lookupType') == 'TEXT_SEMICOLON_DELIM') {
                            return this.feditors['TEXT_DELIM']
                        } else if (a.get('lookupType') == 'TEXT_DELIM') {
                            return this.feditors['TEXT_DELIM']
                        } else if (a.get('lookupType') == 'SFTP_OPERATION') {
                            return this.feditors['SFTP_OPERATION']
                        } else if (a.get('lookupType') == 'EXT_EDIT') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'SOURCE_CODE') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'TIMES') {
                            return this.feditors['TIMES']
                        } else if (a.get('lookupType') == 'EDIT') {
                            return this.feditors['EXT_EDIT']
                        } else if (a.get('lookupType') == 'AGENT') {
                            return this.feditors['AGENT']
                        } else if (a.get('lookupType') == 'MAINFRAME_STEP') {
                            return this.feditors['MF_STEP']
                        } else if (a.get('lookupType') == 'DETAILS') {
                            return this.feditors['DETAILS']
                        } else if (a.get('lookupType') == 'JCL_DETAILS') {
                            return this.feditors['DETAILS']
                        } else if (a.get('lookupType') == 'RESTART_DETAILS') {
                            return this.feditors['RESTART_DETAILS']
                        } else if (a.get('lookupType') == 'SQL_STEP') {
                            return this.feditors['STEP']
                        } else if (a.get('editType') == 'TEXT') {
                            return this.feditors['EXT_MEMO'] // this is the only change overridden by this extension
                        } else if (a.get('editType') == 'DISPLAY' && a.get('name') == 'data') {
                            return this.feditors['EXTDISPLAY']
                        } else if (a.get('editType') in this.feditors) {
                            return this.feditors[a.get('editType')]
                        } else {
                            return this.feditors['default']
                        }
                    }
                }]
            });
            return d
        },
        onDisplayXML: function() {
            var d = this;
            var b = this.getView().processId;
            var a = this.lookupReference('itemsGrid');
            if (a.getSelectionModel().hasSelection()) {
                var c = a.getSelectionModel().getSelection()[0].get('id');
                Ext.Ajax.request({
                    disableCaching: !0,
                    method: 'GET',
                    url: zena.baseURL + zena.serverName + '/processes/' + b + '/items/',
                    params: {
                        type: 'xml'
                    },
                    success: function(b, d) {
                        var c = new Blob([b.responseText], {
                            type: 'text/xml'
                        });
                        var a = URL.createObjectURL(c);
                        window.open(a);
                        URL.revokeObjectURL(a)
                    },
                    failure: function(a, b) {
                        console.log('server-side failure with status code ' + a.status)
                    }
                })
            }
        },
        onDisplayJson: function() {
            var d = this;
            var b = this.getView().processId;
            var a = this.lookupReference('itemsGrid');
            if (a.getSelectionModel().hasSelection()) {
                var c = a.getSelectionModel().getSelection()[0].get('id');
                Ext.Ajax.request({
                    disableCaching: !0,
                    method: 'GET',
                    url: zena.baseURL + zena.serverName + '/processes/' + b + '/items/',
                    success: function(a, d) {
                        var b = Ext.decode(a.responseText);
                        var c = window.open('', '_blank');
                        c.document.body.innerHTML = '<PRE style="color:green; font-size: 20px; font-weight: bold;">' + JSON.stringify(b, undefined, 4) + '</PRE>'
                    },
                    failure: function(a, b) {
                        console.log('server-side failure with status code ' + a.status)
                    }
                })
            }
        },
        onCommentBtnClick: function() {
            var a = this.getView().processId;
            var b = Ext.create('widget.commentsform', {
                title: 'Comments',
                viewModel: {
                    data: {
                        itemId: a,
                        commentsType: 'processes'
                    }
                }
            });
            b.show()
        }
    }, 0, 0, 0, 0, ['controller.processform'], 0, [zena.view.ops.process, 'ProcessFormViewController'], 0);
}else{
  console.log('Zena version mismatch. Not loading extensions to prevent compatibility issues');
}