// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

import {
  Kernel
} from '@jupyterlab/services';

import {
  toArray
} from 'phosphor/lib/algorithm/iteration';

import {
  DisposableDelegate, IDisposable
} from 'phosphor/lib/core/disposable';

import {
  Widget
} from 'phosphor/lib/ui/widget';

import {
  ABCWidgetFactory, DocumentRegistry, TextModelFactory
} from '../../../lib/docregistry';


class WidgetFactory extends ABCWidgetFactory<Widget, DocumentRegistry.IModel> {

  get name(): string {
    return 'test';
  }

  get fileExtensions(): string[] {
    return ['.txt'];
  }

  createNew(context: DocumentRegistry.IContext<DocumentRegistry.IModel>, kernel?: Kernel.IModel): Widget {
    return new Widget();
  }
}


class MarkdownWidgetFactory extends WidgetFactory {

  get name(): string {
    return 'markdown';
  }

  get fileExtensions(): string[] {
    return ['.md'];
  }
}



class PythonWidgetFactory extends WidgetFactory {

  get name(): string {
    return 'python';
  }

  get fileExtensions(): string[] {
    return ['.py'];
  }

  get preferKernel(): boolean {
    return true;
  }

  get canStartKernel(): boolean {
    return true;
  }
}


class GlobalWidgetFactory extends WidgetFactory {

  get name(): string {
    return 'global';
  }

  get fileExtensions(): string[] {
    return ['*'];
  }

  get defaultFor(): string[] {
    return ['*'];
  }
}


class WidgetExtension implements DocumentRegistry.IWidgetExtension<Widget, DocumentRegistry.IModel> {

   createNew(widget: Widget, context: DocumentRegistry.IContext<DocumentRegistry.IModel>): IDisposable {
     return new DisposableDelegate(null);
   }
}


describe('docregistry/registry', () => {

  describe('DocumentRegistry', () => {

    let registry: DocumentRegistry;

    beforeEach(() => {
      registry = new DocumentRegistry();
    });

    afterEach(() => {
      registry.dispose();
    });

    describe('#isDisposed', () => {

      it('should get whether the registry has been disposed', () => {
        expect(registry.isDisposed).to.be(false);
        registry.dispose();
        expect(registry.isDisposed).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the registry', () => {
        registry.addFileType({ name: 'notebook', extension: '.ipynb' });
        registry.dispose();
        expect(registry.isDisposed).to.be(true);
      });

      it('should be safe to call multiple times', () => {
        registry.dispose();
        registry.dispose();
        expect(registry.isDisposed).to.be(true);
      });

    });

    describe('#addWidgetFactory()', () => {

      it('should add the widget factory to the registry', () => {
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        expect(registry.getWidgetFactory('test')).to.be(factory);
        expect(registry.getWidgetFactory('TEST')).to.be(factory);
      });

      it('should become the global default if `*` is given as a defaultFor', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new GlobalWidgetFactory();
        registry.addWidgetFactory(factory);
        expect(registry.defaultWidgetFactory('*')).to.be('foo');
      });

      it('should override an existing global default', () => {
        registry.addModelFactory(new TextModelFactory());
        registry.addWidgetFactory(new GlobalWidgetFactory());
        let factory = new GlobalWidgetFactory();
        registry.addWidgetFactory(factory);
        expect(registry.defaultWidgetFactory('*')).to.be('bar');
      });

      it('should override an existing extension default', () => {
        registry.addModelFactory(new TextModelFactory());
        registry.addWidgetFactory(new WidgetFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        expect(registry.defaultWidgetFactory('.txt')).to.be(factory);
      });

      it('should be removed from the registry when disposed', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        let disposable = registry.addWidgetFactory(factory);
        disposable.dispose();
        expect(registry.getWidgetFactory('test')).to.be(void 0);
      });

    });

    describe('#addModelFactory()', () => {

      it('should add the model factory to the registry', () => {
        let factory = new TextModelFactory();
        registry.addModelFactory(factory);
      });

      it('should be a no-op a factory with the given `name` is already registered', () => {
        let factory = new TextModelFactory();
        registry.addModelFactory(factory);
        let disposable = registry.addModelFactory(new TextModelFactory());
        disposable.dispose();
      });

      it('should be a no-op if the same factory is already registered', () => {
        let factory = new TextModelFactory();
        registry.addModelFactory(factory);
        let disposable = registry.addModelFactory(factory);
        disposable.dispose();
      });

      it('should be removed from the registry when disposed', () => {
        let factory = new TextModelFactory();
        let disposable = registry.addModelFactory(factory);
        disposable.dispose();
      });

    });

    describe('#addWidgetExtension()', () => {

      it('should add a widget extension to the registry', () => {
        let extension = new WidgetExtension();
        registry.addWidgetExtension('foo', extension);
        expect(registry.getWidgetExtensions('foo').next()).to.be(extension);
      });

      it('should be a no-op if the extension is already registered for a given widget factory', () => {
        let extension = new WidgetExtension();
        registry.addWidgetExtension('foo', extension);
        let disposable = registry.addWidgetExtension('foo', extension);
        disposable.dispose();
        expect(registry.getWidgetExtensions('foo').next()).to.be(extension);
      });

      it('should be removed from the registry when disposed', () => {
        let extension = new WidgetExtension();
        let disposable = registry.addWidgetExtension('foo', extension);
        disposable.dispose();
        expect(toArray(registry.getWidgetExtensions('foo')).length).to.be(0);
      });

    });

    describe('#addFileType()', () => {

      it('should add a file type to the document registry', () => {
        let fileType = { name: 'notebook', extension: '.ipynb' };
        registry.addFileType(fileType);
        expect(registry.getFileTypes().next()).to.be(fileType);
      });

      it('should be removed from the registry when disposed', () => {
        let fileType = { name: 'notebook', extension: '.ipynb' };
        let disposable = registry.addFileType(fileType);
        disposable.dispose();
        expect(toArray(registry.getFileTypes()).length).to.be(0);
      });

      it('should be a no-op if a file type of the same name is registered', () => {
        let fileType = { name: 'notebook', extension: '.ipynb' };
        registry.addFileType(fileType);
        let disposable = registry.addFileType(fileType);
        disposable.dispose();
        expect(registry.getFileTypes().next()).to.be(fileType);
      });

    });

    describe('#addCreator()', () => {

      it('should add a file type to the document registry', () => {
        let creator = { name: 'notebook', fileType: 'notebook' };
        registry.addCreator(creator);
        expect(registry.getCreators().next()).to.be(creator);
      });

      it('should be removed from the registry when disposed', () => {
        let creator = { name: 'notebook', fileType: 'notebook' };
        let disposable = registry.addCreator(creator);
        disposable.dispose();
        expect(toArray(registry.getCreators()).length).to.be(0);
      });

      it('should end up in locale order', () => {
        let creators = [
          { name: 'Python Notebook', fileType: 'notebook' },
          { name: 'R Notebook', fileType: 'notebook' },
          { name: 'CSharp Notebook', fileType: 'notebook' }
        ];
        registry.addCreator(creators[0]);
        registry.addCreator(creators[1]);
        registry.addCreator(creators[2]);
        let it = registry.getCreators();
        expect(it.next()).to.be(creators[2]);
        expect(it.next()).to.be(creators[0]);
        expect(it.next()).to.be(creators[1]);
      });

      it('should be a no-op if a file type of the same name is registered', () => {
        let creator = { name: 'notebook', fileType: 'notebook' };
        registry.addCreator(creator);
        let disposable = registry.addCreator(creator);
        disposable.dispose();
        expect(registry.getCreators().next()).to.eql(creator);
      });

    });

    describe('#preferredWidgetFactories()', () => {

      it('should give the valid registered widget factories', () => {
        expect(toArray(registry.preferredWidgetFactories())).to.eql([]);
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        let gFactory = new GlobalWidgetFactory();
        registry.addWidgetFactory(gFactory);
        let factories = registry.preferredWidgetFactories('.txt');
        expect(toArray(factories)).to.eql([factory, gFactory]);
      });

      it('should not list a factory whose model is not registered', () => {
        registry.addWidgetFactory(new WidgetFactory());
        expect(registry.preferredWidgetFactories().next()).to.eql(void 0);
      });

      it('should select the factory for a given extension', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        let mdFactory = new MarkdownWidgetFactory();
        registry.addWidgetFactory(mdFactory);
        expect(registry.preferredWidgetFactories('.txt').next()).to.be(factory);
        expect(registry.preferredWidgetFactories('.md').next()).to.be(mdFactory);
      });

      it('should respect the priority order', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        let gFactory = new GlobalWidgetFactory();
        registry.addWidgetFactory(gFactory);
        let mdFactory = new MarkdownWidgetFactory();
        registry.addWidgetFactory(mdFactory);
        let factories = registry.preferredWidgetFactories('.txt');
        expect(toArray(factories)).to.eql([factory, gFactory]);
      });

    });

    describe('#defaultWidgetFactory()', () => {

      it('should get the default widget factory for a given extension', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        let gFactory = new GlobalWidgetFactory();
        registry.addWidgetFactory(gFactory);
        let mdFactory = new MarkdownWidgetFactory();
        registry.addWidgetFactory(mdFactory);
        expect(registry.defaultWidgetFactory('.txt')).to.be(factory);
        expect(registry.defaultWidgetFactory('.md')).to.be(mdFactory);
        expect(registry.defaultWidgetFactory()).to.be(gFactory);
      });

    });

    describe('#getFileTypes()', () => {

      it('should get the registered file types', () => {
        expect(toArray(registry.getFileTypes()).length).to.be(0);
        let fileTypes = [
          { name: 'notebook', extension: '.ipynb' },
          { name: 'python', extension: '.py' }
        ];
        registry.addFileType(fileTypes[0]);
        registry.addFileType(fileTypes[1]);
        let values = registry.getFileTypes();
        expect(values.next()).to.be(fileTypes[0]);
        expect(values.next()).to.be(fileTypes[1]);
      });

    });

    describe('#getCreators()', () => {

      it('should get the registered file creators', () => {
        expect(toArray(registry.getCreators()).length).to.be(0);
        let creators = [
          { name: 'Python Notebook', fileType: 'notebook' },
          { name: 'R Notebook', fileType: 'notebook' },
          { name: 'CSharp Notebook', fileType: 'notebook' }
        ];
        registry.addCreator(creators[0]);
        registry.addCreator(creators[1]);
        registry.addCreator(creators[2]);
        expect(toArray(registry.getCreators()).length).to.be(3);
        expect(registry.getCreators().next().name).to.be('CSharp Notebook');
      });

    });

    describe('#getFileType()', () => {

      it('should get a file type by name', () => {
        let fileTypes = [
          { name: 'notebook', extension: '.ipynb' },
          { name: 'python', extension: '.py' }
        ];
        registry.addFileType(fileTypes[0]);
        registry.addFileType(fileTypes[1]);
        expect(registry.getFileType('notebook')).to.be(fileTypes[0]);
        expect(registry.getFileType('python')).to.be(fileTypes[1]);
        expect(registry.getFileType('r')).to.be(void 0);
      });
    });

    describe('#getCreator()', () => {

      it('should get a creator by name', () => {
        let creators = [
          { name: 'Python Notebook', fileType: 'notebook' },
          { name: 'R Notebook', fileType: 'notebook' },
          { name: 'Shell Notebook', fileType: 'notebook' }
        ];
        registry.addCreator(creators[0]);
        registry.addCreator(creators[1]);
        registry.addCreator(creators[2]);
        expect(registry.getCreator('Python Notebook')).to.be(creators[0]);
        expect(registry.getCreator('r notebook')).to.be(creators[1]);
        expect(registry.getCreator('shell Notebook')).to.be(creators[2]);
        expect(registry.getCreator('foo')).to.be(void 0);
      });

    });

    describe('#getKernelPreference()', () => {

      it('should get a kernel preference', () => {
        registry.addModelFactory(new TextModelFactory());
        registry.addWidgetFactory(new WidgetFactory());
        registry.addWidgetFactory(new PythonWidgetFactory());

        let pref = registry.getKernelPreference('.c', 'global');
        expect(pref.language).to.be('clike');
        expect(pref.preferKernel).to.be(false);
        expect(pref.canStartKernel).to.be(false);

        pref = registry.getKernelPreference('.py', 'python');
        expect(pref.language).to.be('python');
        expect(pref.preferKernel).to.be(true);
        expect(pref.canStartKernel).to.be(true);

        pref = registry.getKernelPreference('.py', 'baz');
        expect(pref).to.be(void 0);
      });

    });

    describe('#getModelFactory()', () => {

      it('should get a registered model factory by name', () => {
        let mFactory = new TextModelFactory();
        registry.addModelFactory(mFactory);
        expect(registry.getModelFactory('text')).to.be(mFactory);
      });

    });

    describe('#getWidgetFactory()', () => {

      it('should get a widget factory by name', () => {
        registry.addModelFactory(new TextModelFactory());
        let factory = new WidgetFactory();
        registry.addWidgetFactory(factory);
        let mdFactory = new MarkdownWidgetFactory();
        registry.addWidgetFactory(mdFactory);
        expect(registry.getWidgetFactory('test')).to.be(factory);
        expect(registry.getWidgetFactory('Test')).to.be(factory);
        expect(registry.getWidgetFactory('markdown')).to.be(mdFactory);
        expect(registry.getWidgetFactory('baz')).to.be(void 0);
      });

    });

    describe('#getWidgetExtensions()', () => {

      it('should get the registered extensions for a given widget', () => {
        let foo = new WidgetExtension();
        let bar = new WidgetExtension();
        registry.addWidgetExtension('fizz', foo);
        registry.addWidgetExtension('fizz', bar);
        registry.addWidgetExtension('buzz', foo);
        expect(registry.getWidgetExtensions('fizz').next()).to.be(foo);
        expect(registry.getWidgetExtensions('fizz').next()).to.be(bar);
        expect(toArray(registry.getWidgetExtensions('fizz')).length).to.be(2);
        expect(registry.getWidgetExtensions('buzz').next()).to.be(foo);
        expect(toArray(registry.getWidgetExtensions('buzz')).length).to.be(1);
        expect(toArray(registry.getWidgetExtensions('baz')).length).to.be(0);
      });

    });

  });

});
