import * as vs from "vscode";
import { IAmDisposable } from "../../shared/interfaces";
import { GroupNode, SuiteNode, TestNode, TestTreeModel, TreeNode } from "../../shared/test/test_model";
import { disposeAll } from "../../shared/utils";


export class DartTestProvider implements vs.TestProvider<vs.TestItem>, IAmDisposable {
	private disposables: IAmDisposable[] = [];

	constructor(private readonly model: TestTreeModel) {
		this.disposables.push(model.onDidChangeTreeData.listen((node) => vs.test.onDidChangeTestResults));
	}

	public createWorkspaceTestHierarchy(workspace: vs.WorkspaceFolder): vs.TestHierarchy<vs.TestItem> | undefined {
		const onDidChangeTestEmitter = new vs.EventEmitter<vs.TestItem>();
		const onDidChangeTest: vs.Event<vs.TestItem> = onDidChangeTestEmitter.event;

		const root: vs.TestItem = {
			label: workspace.name,
			children: Object.values(this.model.suites).map((s) => testItemBuilder.createNode(s.node)),
		};
		return {
			dispose: this.model.onDidChangeTreeData.listen((node) => {
				
				onDidChangeTestEmitter.fire(root);
			}).dispose,
			onDidChangeTest,
			root,
		} as vs.TestHierarchy<vs.TestItem>;
	}

	public dispose(): any {
		disposeAll(this.disposables);
	}
}

class TestItemBuilder {
	public createNode(node: TreeNode): vs.TestItem {
		if (node instanceof TestNode) {
			return {
				label: node.label,
			} as vs.TestItem;
		}
		else if (node instanceof SuiteNode || node instanceof GroupNode) {
			return {
				label: node.label ?? node.suiteData.path,
				children: node.children?.map(testItemBuilder.createNode),
			} as vs.TestItem;
		} else {
			return {label:"UNKNOWN NODE!!!"};
		}
	}

}

const testItemBuilder = new TestItemBuilder();

